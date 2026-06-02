import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, AlertTriangle, Info, CheckCircle, Check, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Drawer } from "./Drawer";
import { alertasApi } from "@/lib/api/endpoints/alertas";
import { formatRelativeTime } from "@/lib/utils";
import type { Alerta, PrioridadeAlerta } from "@/types";

const PRIORIDADE_CONFIG: Record<PrioridadeAlerta, { icon: typeof AlertCircle; color: string; label: string }> = {
  CRITICA: { icon: AlertCircle, color: "text-danger", label: "Críticos" },
  ALTA:    { icon: AlertTriangle, color: "text-warn", label: "Altos" },
  MEDIA:   { icon: Info, color: "text-amber", label: "Médios" },
  BAIXA:   { icon: CheckCircle, color: "text-ok", label: "Baixos" },
};

const PRIORIDADE_ORDER: PrioridadeAlerta[] = ["CRITICA", "ALTA", "MEDIA", "BAIXA"];

function AlertItem({ alerta, onRead, onVerAnimal }: {
  alerta: Alerta;
  onRead: (id: string) => void;
  onVerAnimal: (id: string) => void;
}) {
  const { icon: Icon, color } = PRIORIDADE_CONFIG[alerta.prioridade];

  return (
    <div
      className={[
        "flex gap-3 p-3 rounded-[12px] border transition-colors",
        alerta.lido ? "border-line opacity-60" : "border-line bg-beige/50",
      ].join(" ")}
    >
      <Icon size={17} className={`${color} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-ink leading-snug">{alerta.mensagem}</p>
        <button
          className="text-[11px] text-green-700 font-mono mt-1 hover:underline"
          onClick={() => onVerAnimal(alerta.animal.id)}
        >
          {alerta.animal.codigo} — {alerta.animal.nome}
        </button>
        <p className="text-[11px] text-ink-4 mt-0.5">{formatRelativeTime(alerta.data_disparo)}</p>
      </div>
      {!alerta.lido && (
        <button
          onClick={() => onRead(alerta.id)}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-[8px] text-ink-4 hover:bg-beige transition-colors"
          aria-label="Marcar como lido"
        >
          <Check size={14} />
        </button>
      )}
    </div>
  );
}

interface AlertDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function AlertDrawer({ open, onClose }: AlertDrawerProps) {
  const [filter, setFilter] = useState<"nao_lidos" | "todos">("nao_lidos");
  const qc = useQueryClient();
  const navigate = useNavigate();

  const alertasFiltros = filter === "nao_lidos" ? { lido: false } : {};
  const { data } = useQuery({
    queryKey: ["alertas", "list", alertasFiltros],
    queryFn: ({ signal }) => alertasApi.listar(alertasFiltros, signal),
    enabled: open,
  });

  const markRead = useMutation({
    mutationFn: alertasApi.marcarLido,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["alertas", "list"] });
      void qc.invalidateQueries({ queryKey: ["alertas", "contagem"] });
    },
  });

  const allAlertas = data?.data ?? [];

  const grouped = PRIORIDADE_ORDER.reduce<Record<PrioridadeAlerta, Alerta[]>>(
    (acc, p) => {
      acc[p] = allAlertas.filter((a) => a.prioridade === p);
      return acc;
    },
    { CRITICA: [], ALTA: [], MEDIA: [], BAIXA: [] }
  );

  const handleVerAnimal = (animalId: string) => {
    onClose();
    void navigate(`/animais/${animalId}`);
  };

  return (
    <Drawer open={open} onClose={onClose} title="Central de Alertas">
      {/* Filter */}
      <div className="flex gap-2 mb-4 -mt-1">
        {(["nao_lidos", "todos"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={[
              "flex-1 py-2 rounded-[10px] text-[13px] font-medium transition-colors border",
              filter === f
                ? "bg-green-900 text-white border-green-900"
                : "bg-surface text-ink-3 border-line hover:bg-beige",
            ].join(" ")}
          >
            {f === "nao_lidos" ? "Não lidos" : "Todos"}
            {f === "nao_lidos" && (data?.meta.nao_lidos ?? 0) > 0 ? (
              <span className="ml-1.5 bg-danger text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {data?.meta.nao_lidos}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {allAlertas.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-ok-bg flex items-center justify-center">
            <Bell size={20} className="text-ok" />
          </div>
          <p className="text-[14px] font-semibold text-ink">Nenhum alerta</p>
          <p className="text-[13px] text-ink-4">
            {filter === "nao_lidos" ? "Todos os alertas foram lidos." : "Nenhum alerta registrado."}
          </p>
        </div>
      ) : (
        /* Grouped list */
        <div className="flex flex-col gap-4">
          {PRIORIDADE_ORDER.map((prioridade) => {
            const items = grouped[prioridade];
            if (items.length === 0) return null;
            const { label } = PRIORIDADE_CONFIG[prioridade];
            return (
              <div key={prioridade}>
                <p className="text-[11px] font-bold text-ink-3 uppercase tracking-[0.06em] mb-2">
                  {label} ({items.length})
                </p>
                <div className="flex flex-col gap-2">
                  {items.map((a) => (
                    <AlertItem
                      key={a.id}
                      alerta={a}
                      onRead={(id) => markRead.mutate(id)}
                      onVerAnimal={handleVerAnimal}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Drawer>
  );
}
