import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, AlertTriangle, Info, CheckCircle, Check } from "lucide-react";
import { Drawer } from "./Drawer";
import { alertasApi } from "@/lib/api/endpoints/alertas";
import type { Alerta, PrioridadeAlerta } from "@/types";

const prioridadeConfig: Record<PrioridadeAlerta, { icon: typeof AlertCircle; color: string }> = {
  CRITICA: { icon: AlertCircle, color: "text-danger" },
  ALTA: { icon: AlertTriangle, color: "text-warn" },
  MEDIA: { icon: Info, color: "text-amber" },
  BAIXA: { icon: CheckCircle, color: "text-ok" },
};

function AlertItem({ alerta, onRead }: { alerta: Alerta; onRead: (id: string) => void }) {
  const { icon: Icon, color } = prioridadeConfig[alerta.prioridade];

  return (
    <div
      className={[
        "flex gap-3 p-3 rounded-[12px] border transition-colors",
        alerta.lido ? "border-line opacity-60" : "border-line bg-beige/50",
      ].join(" ")}
    >
      <Icon size={18} className={`${color} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-ink leading-snug">{alerta.mensagem}</p>
        <p className="text-[11px] text-ink-4 mt-1 font-mono">
          {alerta.animal.codigo} · {new Date(alerta.data_disparo).toLocaleDateString("pt-BR")}
        </p>
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
  const [filter, setFilter] = useState<"todos" | "nao_lidos">("nao_lidos");
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["alertas", filter],
    queryFn: () => {
      const params = filter === "nao_lidos" ? { lido: false as const } : {};
      return alertasApi.listar(params);
    },
    enabled: open,
  });

  const markRead = useMutation({
    mutationFn: alertasApi.marcarLido,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alertas"] }),
  });

  const alertas = data?.data ?? [];

  return (
    <Drawer open={open} onClose={onClose} title="Central de Alertas">
      {/* Filter tabs */}
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
            {f === "nao_lidos" && data?.meta.nao_lidos ? (
              <span className="ml-1.5 bg-danger text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {data.meta.nao_lidos}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {alertas.length === 0 ? (
          <p className="text-center text-ink-4 text-[14px] py-10">
            {filter === "nao_lidos" ? "Nenhum alerta não lido." : "Nenhum alerta."}
          </p>
        ) : (
          alertas.map((a) => (
            <AlertItem key={a.id} alerta={a} onRead={(id) => markRead.mutate(id)} />
          ))
        )}
      </div>
    </Drawer>
  );
}
