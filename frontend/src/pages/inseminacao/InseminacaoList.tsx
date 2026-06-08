import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Plus, AlertCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { inseminacoesApi } from "@/lib/api/endpoints/inseminacoes";
import { ModalNewInseminacaoSelector } from "@/components/modals/ModalInseminacaoSelector";
import { Modal05Diagnostico } from "@/components/modals/Modal05Diagnostico";
import type { Inseminacao } from "@/types";

type Tab = "historico" | "pendentes";

const TIPO_LABELS = { IA_CONVENCIONAL: "IA Conv.", IATF: "IATF", TE: "TE" };
const RESULTADO_VARIANT = {
  PENDENTE: "warn" as const,
  PRENHA: "ok" as const,
  VAZIA: "danger" as const,
  CANCELADA: "ghost" as const,
};
const RESULTADO_LABELS = {
  PENDENTE: "Pendente",
  PRENHA: "Prenha",
  VAZIA: "Vazia",
  CANCELADA: "Cancelada",
};

// ── Desktop table row ────────────────────────────────────────────

function InseminacaoRow({ ins, onDiag }: { ins: Inseminacao; onDiag: () => void }) {
  return (
    <tr className="border-b border-line hover:bg-beige/50 transition-colors">
      <td className="px-4 py-3">
        <p className="text-[14px] font-medium text-ink">{ins.animal.nome}</p>
        <p className="text-[11px] font-mono text-ink-4">{ins.animal.codigo}</p>
      </td>
      <td className="px-4 py-3 text-[13px] text-ink-2">
        <span className="flex items-center gap-1">
          {String(ins.id).startsWith("local:") && (
            <Clock size={12} className="text-ink-4 shrink-0" aria-label="Aguardando sincronização" />
          )}
          {new Date(ins.data_inseminacao).toLocaleDateString("pt-BR")}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-[12px] font-mono text-ink-3 bg-beige px-2 py-0.5 rounded-[6px]">
          {TIPO_LABELS[ins.tipo]}
        </span>
      </td>
      <td className="px-4 py-3 text-[13px] text-ink-2">{ins.reprodutor.nome}</td>
      <td className="px-4 py-3">
        <Badge variant={RESULTADO_VARIANT[ins.resultado]}>{RESULTADO_LABELS[ins.resultado]}</Badge>
      </td>
      <td className="px-4 py-3">
        {ins.resultado === "PENDENTE" && (
          <Button variant="secondary" size="sm" onClick={onDiag}>
            Registrar diagnóstico
          </Button>
        )}
      </td>
    </tr>
  );
}

// ── Mobile card ──────────────────────────────────────────────────

function InseminacaoCard({ ins, onDiag }: { ins: Inseminacao; onDiag: () => void }) {
  return (
    <div className="rounded-[14px] border border-line bg-surface p-4 flex flex-col gap-3">
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-ink truncate">{ins.animal.nome}</p>
          <p className="text-[11px] font-mono text-ink-4">{ins.animal.codigo}</p>
        </div>
        <Badge variant={RESULTADO_VARIANT[ins.resultado]}>{RESULTADO_LABELS[ins.resultado]}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[13px]">
        <div>
          <span className="text-ink-4">Data: </span>
          <span className="text-ink-2">
            {new Date(ins.data_inseminacao).toLocaleDateString("pt-BR")}
          </span>
        </div>
        <div>
          <span className="text-ink-4">Tipo: </span>
          <span className="font-mono text-ink-3 bg-beige px-1.5 py-0.5 rounded-[5px] text-[11px]">
            {TIPO_LABELS[ins.tipo]}
          </span>
        </div>
        <div className="col-span-2">
          <span className="text-ink-4">Reprodutor: </span>
          <span className="text-ink-2">{ins.reprodutor.nome}</span>
        </div>
      </div>
      {ins.resultado === "PENDENTE" && (
        <Button variant="secondary" size="sm" onClick={onDiag} className="self-end">
          Registrar diagnóstico
        </Button>
      )}
    </div>
  );
}

// ── Pendentes card (unchanged) ───────────────────────────────────

function PendenteRow({ ins, onDiag }: { ins: Inseminacao; onDiag: () => void }) {
  const isUrgent = ins.dias_decorridos > 30;
  return (
    <Card
      padding="sm"
      className={`cursor-pointer hover:border-warn transition-colors ${isUrgent ? "border-danger-bg bg-danger-bg/20" : ""}`}
      onClick={onDiag}
    >
      <div className="flex items-center gap-3">
        {isUrgent && <AlertCircle size={18} className="text-danger shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[14px] font-semibold text-ink">{ins.animal.nome}</p>
            <span className="font-mono text-[11px] text-ink-4">{ins.animal.codigo}</span>
            {isUrgent && <Badge variant="danger">Crítico</Badge>}
          </div>
          <p className="text-[12px] text-ink-3 mt-0.5">
            Inseminação em {new Date(ins.data_inseminacao).toLocaleDateString("pt-BR")} ·{" "}
            <strong className={isUrgent ? "text-danger" : "text-warn"}>
              {ins.dias_decorridos} dias decorridos
            </strong>
          </p>
        </div>
        <Button variant={isUrgent ? "danger" : "secondary"} size="sm">
          Diagnóstico
        </Button>
      </div>
    </Card>
  );
}

// ── Page ─────────────────────────────────────────────────────────

export function InseminacaoListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>("historico");
  const [novaOpen, setNovaOpen] = useState(false);
  const [diagOpen, setDiagOpen] = useState(false);
  const [selectedIns, setSelectedIns] = useState<Inseminacao | null>(null);
  const [preselectedAnimalId, setPreselectedAnimalId] = useState<string | null>(null);

  const animalIdParam = searchParams.get("animal_id");
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  useEffect(() => {
    if (animalIdParam && UUID_RE.test(animalIdParam)) {
      setTimeout(() => {
        setPreselectedAnimalId(animalIdParam);
        setNovaOpen(true);
        setSearchParams({}, { replace: true });
      }, 0);
    }
  }, [animalIdParam, setSearchParams]);

  const { data: historico, isLoading: histLoading, error: histError, refetch: histRefetch } = useQuery({
    queryKey: ["inseminacoes", "list", { limit: 20 }],
    queryFn: ({ signal }) => inseminacoesApi.listar({ limit: 20 }, signal),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
    enabled: tab === "historico",
  });

  const { data: pendentes, isLoading: pendLoading } = useQuery({
    queryKey: ["inseminacoes", "pendentes-diagnostico"],
    queryFn: ({ signal }) => inseminacoesApi.pendentes(undefined, signal),
    staleTime: 1 * 60 * 1000,
    enabled: tab === "pendentes",
  });

  const openDiag = (ins: Inseminacao) => {
    setSelectedIns(ins);
    setDiagOpen(true);
  };

  const insHistorico = historico?.data ?? [];
  const insPendentes = pendentes?.data ?? [];

  return (
    <>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1
              className="text-[22px] font-bold text-ink"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Inseminação
            </h1>
            <p className="text-[14px] text-ink-3 mt-0.5">Controle reprodutivo do rebanho</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setNovaOpen(true)}>
            <Plus size={16} />
            Nova Inseminação
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-line overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch]">
          {(
            [
              ["historico", "Histórico"],
              [
                "pendentes",
                `Diagnósticos Pendentes${insPendentes.length > 0 ? ` (${insPendentes.length})` : ""}`,
              ],
            ] as const
          ).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                "px-5 py-3 text-[14px] font-medium border-b-2 transition-colors flex-shrink-0 whitespace-nowrap",
                tab === t
                  ? "border-green-700 text-green-700"
                  : "border-transparent text-ink-3 hover:text-ink",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab: Histórico */}
        {tab === "historico" &&
          (histError ? (
            <ErrorState error={histError} onRetry={() => void histRefetch()} />
          ) : histLoading ? (
            <div className="flex flex-col gap-3">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="h-14 animate-pulse bg-beige">
                  {null}
                </Card>
              ))}
            </div>
          ) : insHistorico.length === 0 ? (
            <p className="text-center text-[14px] text-ink-3 py-12">
              Nenhuma inseminação registrada.
            </p>
          ) : (
            <>
              {/* Mobile: cards */}
              <div className="flex flex-col gap-3 md:hidden">
                {insHistorico.map((ins) => (
                  <InseminacaoCard key={ins.id} ins={ins} onDiag={() => openDiag(ins)} />
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden md:block overflow-hidden rounded-[18px] border border-line bg-surface">
                <table className="w-full">
                  <thead>
                    <tr className="bg-beige border-b border-line">
                      {["Animal", "Data", "Tipo", "Reprodutor", "Resultado", "Ação"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-[12px] font-semibold text-ink-2 uppercase tracking-[0.04em]"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {insHistorico.map((ins) => (
                      <InseminacaoRow key={ins.id} ins={ins} onDiag={() => openDiag(ins)} />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ))}

        {/* Tab: Pendentes */}
        {tab === "pendentes" &&
          (pendLoading ? (
            <div className="flex flex-col gap-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="h-16 animate-pulse bg-beige">
                  {null}
                </Card>
              ))}
            </div>
          ) : insPendentes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">✅</p>
              <p className="text-[15px] font-semibold text-ink">Nenhum diagnóstico pendente</p>
              <p className="text-[14px] text-ink-3 mt-1">Todos os diagnósticos estão em dia.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {insPendentes.map((ins) => (
                <PendenteRow key={ins.id} ins={ins} onDiag={() => openDiag(ins)} />
              ))}
            </div>
          ))}
      </div>

      <ModalNewInseminacaoSelector
        open={novaOpen}
        onClose={() => { setNovaOpen(false); setPreselectedAnimalId(null); }}
        {...(preselectedAnimalId ? { preselectedAnimalId } : {})}
      />
      <Modal05Diagnostico
        open={diagOpen}
        onClose={() => setDiagOpen(false)}
        inseminacao={selectedIns}
      />
    </>
  );
}
