import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tooltip } from "radix-ui";
import {
  ArrowLeft, Dna, Pencil, Trash2, ToggleLeft, ToggleRight,
  Info, FlaskConical, PawPrint, ExternalLink, Syringe,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { reprodutoresApi } from "@/lib/api/endpoints/reprodutores";
import { inseminacoesApi } from "@/lib/api/endpoints/inseminacoes";
import { Modal04ReprodutorRapido } from "@/components/modals/Modal04ReprodutorRapido";
import { Modal10DeleteConfirm } from "@/components/modals/Modal10DeleteConfirm";
import { formatRelativeTime, formatDate } from "@/lib/utils";
import type { Especie, ResultadoInseminacao } from "@/types";

/* ── Constantes ─────────────────────────────────────────────────── */

const ESPECIE_EMOJI: Record<Especie, string> = { BOVINO: "🐄", OVINO: "🐑", CAPRINO: "🐐" };
const ESPECIE_LABEL: Record<Especie, string> = { BOVINO: "Bovino", OVINO: "Ovino", CAPRINO: "Caprino" };
const ESPECIE_VARIANT: Record<Especie, "bovino" | "ovino" | "caprino"> = {
  BOVINO: "bovino", OVINO: "ovino", CAPRINO: "caprino",
};

const TIPO_LABEL: Record<string, string> = {
  IA_CONVENCIONAL: "IA Conv.", IATF: "IATF", TE: "TE",
};

const RESULTADO_VARIANT: Record<ResultadoInseminacao, string> = {
  PRENHA: "ok", PENDENTE: "warn", VAZIA: "danger", CANCELADA: "ghost",
};
const RESULTADO_LABEL: Record<ResultadoInseminacao, string> = {
  PRENHA: "Prenha", PENDENTE: "Pendente", VAZIA: "Vazia", CANCELADA: "Cancelada",
};

/* ── Tooltip simples ─────────────────────────────────────────────── */

function InfoTooltip({ content }: { content: string }) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button className="text-ink-4 hover:text-ink-2 transition-colors" aria-label="Informação">
            <Info size={13} />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="max-w-[220px] px-3 py-2 text-[12px] text-ink bg-surface border border-line rounded-[8px] shadow-[var(--shadow-md)] z-50"
            sideOffset={5}
          >
            {content}
            <Tooltip.Arrow className="fill-line" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

/* ── KPI card ────────────────────────────────────────────────────── */

function KPICard({ label, value, badge, tooltip }: {
  label: string; value: string | number;
  badge?: "ok" | "warn" | "danger"; tooltip?: string;
}) {
  return (
    <Card padding="sm" className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <p className="text-[12px] font-medium text-ink-3">{label}</p>
        {tooltip && <InfoTooltip content={tooltip} />}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-[28px] font-bold text-ink leading-none" style={{ fontFamily: "var(--font-display)" }}>
          {value}
        </span>
        {badge && <Badge variant={badge}>{badge === "ok" ? "Ótimo" : badge === "warn" ? "Regular" : "Baixo"}</Badge>}
      </div>
    </Card>
  );
}

/* ── DEP card row ────────────────────────────────────────────────── */

function DepRow({ label, value, tooltip }: { label: string; value?: number; tooltip: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-line last:border-0">
      <div className="flex items-center gap-1.5">
        <span className="text-[13px] text-ink-2">{label}</span>
        <InfoTooltip content={tooltip} />
      </div>
      {value !== undefined ? (
        <span className="text-[14px] font-semibold text-ink">{value.toFixed(2)}</span>
      ) : (
        <span className="text-[13px] text-ink-4 italic">Não informado</span>
      )}
    </div>
  );
}

/* ── Modal confirmação desativar ─────────────────────────────────── */

function ModalConfirmDesativar({ nome, onClose, onConfirm }: {
  nome: string; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface w-full flex flex-col rounded-t-[24px] md:rounded-[16px] md:max-w-sm md:border md:border-line md:shadow-[var(--shadow-lg)] md:mx-4">
        <div className="flex justify-center pt-3 pb-1 shrink-0 md:hidden">
          <div className="w-10 h-1 bg-line rounded-full" />
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          <p className="text-[15px] font-semibold text-ink">Desativar {nome}?</p>
          <p className="text-[13px] text-ink-3">
            Este reprodutor não aparecerá mais nos selects de inseminação. O histórico permanece intacto.
          </p>
          <div className="flex gap-2 justify-end mt-1">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
            <Button variant="amber" size="sm" onClick={onConfirm}>Desativar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Modal erro 409 ──────────────────────────────────────────────── */

function Modal409({ nome, total, onClose, onDesativar }: {
  nome: string; total: number; onClose: () => void; onDesativar: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface w-full flex flex-col rounded-t-[24px] md:rounded-[16px] md:max-w-md md:border md:border-line md:shadow-[var(--shadow-lg)] md:mx-4">
        <div className="flex justify-center pt-3 pb-1 shrink-0 md:hidden">
          <div className="w-10 h-1 bg-line rounded-full" />
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          <p className="text-[15px] font-semibold text-ink">Este reprodutor não pode ser excluído</p>
          <p className="text-[13px] text-ink-2">
            <strong>{nome}</strong> está vinculado a <strong>{total} inseminações</strong> no histórico do rebanho.
            Reprodutores com histórico só podem ser <strong>DESATIVADOS</strong>.
          </p>
          <div className="flex flex-col gap-2 mt-1">
            <Button variant="amber" size="sm" onClick={onDesativar}>
              <ToggleLeft size={15} /> Desativar em vez de excluir
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────── */

export function ReprodutorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showConfirmDesativar, setShowConfirmDesativar] = useState(false);
  const [show409, setShow409] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["reprodutores", "detail", id],
    queryFn: ({ signal }) => reprodutoresApi.buscar(id!, signal),
    enabled: !!id,
  });

  const { data: insDataRaw } = useQuery({
    queryKey: ["inseminacoes", "list", { reprodutor_id: id }],
    queryFn: ({ signal }) => inseminacoesApi.listar({ limit: 10 }, signal),
    enabled: !!id,
  });

  /* Filtra inseminações do reprodutor no client (mock não filtra por reprodutor_id) */
  const inseminacoes = (insDataRaw?.data ?? [])
    .filter((ins) => ins.reprodutor.id === id)
    .slice(0, 10);

  const toggleMutation = useMutation({
    mutationFn: (ativo: boolean) => reprodutoresApi.atualizar(id!, { ativo }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["reprodutores", "detail", id] });
      void qc.invalidateQueries({ queryKey: ["reprodutores", "list"] });
      setShowConfirmDesativar(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => reprodutoresApi.deletar(id!),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["reprodutores", "list"] });
      navigate("/reprodutores");
    },
    onError: (err: { response?: { status?: number } }) => {
      if (err?.response?.status === 409) {
        setShowDelete(false);
        setShow409(true);
      }
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-[900px] mx-auto px-4 py-10 flex items-center justify-center gap-3 text-ink-3">
        <Dna size={20} className="animate-spin" />
        <span className="text-[14px]">Carregando perfil do reprodutor...</span>
      </div>
    );
  }

  const rep = data?.data;

  if (!rep) {
    return (
      <div className="max-w-[900px] mx-auto px-4 py-10 flex flex-col items-center gap-4 text-center">
        <p className="text-[16px] text-ink-2">Reprodutor não encontrado.</p>
        <Button variant="secondary" size="sm" onClick={() => navigate("/reprodutores")}>
          <ArrowLeft size={14} /> Voltar à lista
        </Button>
      </div>
    );
  }

  /* ── Cálculos ── */
  const taxa = rep.taxa_prenhez;
  const totalIns = rep.total_inseminacoes ?? 0;
  const temDadosSuficientes = totalIns >= 5;
  const taxaPct = taxa !== undefined ? Math.round(taxa * 100) : 0;
  const taxaBadge: "ok" | "warn" | "danger" = taxaPct >= 60 ? "ok" : taxaPct >= 40 ? "warn" : "danger";

  return (
    <div className="max-w-[900px] mx-auto px-4 py-6 flex flex-col gap-5">

      {/* Botão voltar */}
      <button
        onClick={() => navigate("/reprodutores")}
        className="self-start flex items-center gap-1.5 text-[13px] text-ink-3 hover:text-ink transition-colors"
      >
        <ArrowLeft size={15} /> Voltar à lista
      </button>

      {/* ── Bloco 1: Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-[14px] bg-green-700/10 flex items-center justify-center shrink-0">
            {rep.tipo === "SEMEN_EXTERNO"
              ? <FlaskConical size={24} className="text-amber" />
              : <PawPrint size={24} className="text-green-700" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[22px] font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
                {rep.nome}
              </h1>
              {rep.tipo === "SEMEN_EXTERNO" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-soft text-amber border border-amber/20">
                  <FlaskConical size={10} /> Sêmen Externo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-700/[0.12] text-green-700 border border-green-700/20">
                  <PawPrint size={10} /> Animal Próprio
                </span>
              )}
            </div>
            <p className="text-[13px] text-ink-3">
              {ESPECIE_EMOJI[rep.especie]} {ESPECIE_LABEL[rep.especie]} · {rep.raca}
              {rep.registro && ` · ${rep.registro}`}
              {" · "}
              {rep.ativo
                ? <span className="text-ok font-medium">ATIVO</span>
                : <span className="text-ink-4 font-medium">INATIVO</span>}
            </p>
            {rep.tipo === "ANIMAL_PROPRIO" && rep.animal_id && (
              <Link
                to={`/animais/${rep.animal_id}`}
                className="text-[12px] text-green-700 hover:underline flex items-center gap-1 mt-0.5"
              >
                Ver perfil do animal <ExternalLink size={11} />
              </Link>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={() => setShowEdit(true)}>
            <Pencil size={14} /> Editar
          </Button>
          {rep.ativo ? (
            <Button variant="amber" size="sm" onClick={() => setShowConfirmDesativar(true)}>
              <ToggleRight size={14} /> Desativar
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => toggleMutation.mutate(true)}>
              <ToggleLeft size={14} /> Reativar
            </Button>
          )}
          <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>
            <Trash2 size={14} /> Excluir
          </Button>
        </div>
      </div>

      {/* ── Bloco 2: Card Identidade ── */}
      <Card padding="md">
        <h2 className="text-[14px] font-semibold text-ink mb-3" style={{ fontFamily: "var(--font-display)" }}>
          Identidade
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          <div>
            <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-[0.06em]">Espécie</p>
            <div className="mt-0.5">
              <Badge variant={ESPECIE_VARIANT[rep.especie]}>
                {ESPECIE_EMOJI[rep.especie]} {ESPECIE_LABEL[rep.especie]}
              </Badge>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-[0.06em]">Raça</p>
            <p className="text-[14px] text-ink mt-0.5">{rep.raca}</p>
          </div>
          {rep.registro && (
            <div>
              <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-[0.06em]">Registro</p>
              <p className="text-[14px] font-mono text-ink mt-0.5">{rep.registro}</p>
            </div>
          )}
          {rep.tipo === "SEMEN_EXTERNO" && rep.empresa_semen && (
            <div>
              <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-[0.06em]">Empresa Fornecedora</p>
              <p className="text-[14px] text-ink mt-0.5">{rep.empresa_semen}</p>
            </div>
          )}
          {rep.tipo === "ANIMAL_PROPRIO" && rep.animal_id && (
            <div>
              <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-[0.06em]">Animal Vinculado</p>
              <Link to={`/animais/${rep.animal_id}`} className="text-[14px] text-green-700 hover:underline flex items-center gap-1 mt-0.5">
                Ver perfil <ExternalLink size={11} />
              </Link>
            </div>
          )}
          <div>
            <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-[0.06em]">Data de Cadastro</p>
            <p className="text-[14px] text-ink mt-0.5">{formatDate(rep.created_at)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-[0.06em]">Status</p>
            <div className="mt-0.5">
              <Badge variant={rep.ativo ? "ok" : "ghost"}>{rep.ativo ? "ATIVO" : "INATIVO"}</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Bloco 3: Dados Genéticos ── */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-semibold text-ink" style={{ fontFamily: "var(--font-display)" }}>
            Dados Genéticos (DEP)
          </h2>
          {rep.dep_peso_desmame === undefined && rep.dep_fertilidade === undefined && (
            <button
              onClick={() => setShowEdit(true)}
              className="text-[12px] text-green-700 hover:underline"
            >
              Editar para preencher
            </button>
          )}
        </div>
        <DepRow
          label="DEP Peso ao Desmame (kg)"
          {...(rep.dep_peso_desmame !== undefined ? { value: rep.dep_peso_desmame } : {})}
          tooltip="Diferença Esperada na Progênie para peso ao desmame. Valores positivos indicam progênie mais pesada."
        />
        <DepRow
          label="DEP Fertilidade"
          {...(rep.dep_fertilidade !== undefined ? { value: rep.dep_fertilidade } : {})}
          tooltip="Estima a contribuição genética para a fertilidade da prole. Valores entre 0 e 1."
        />
        <DepRow
          label="DEP Acurácia"
          {...(rep.dep_acuracia !== undefined ? { value: rep.dep_acuracia } : {})}
          tooltip="Quanto mais próximo de 1, mais confiável é o DEP. Acima de 0.7 indica alta confiabilidade."
        />
      </Card>

      {/* ── Bloco 4: KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Total de inseminações" value={totalIns} />
        <KPICard
          label="Taxa de prenhez"
          value={temDadosSuficientes ? `${taxaPct}%` : "—"}
          {...(temDadosSuficientes ? { badge: taxaBadge } : {})}
          {...(!temDadosSuficientes ? { tooltip: "Dados insuficientes — mínimo 5 inseminações com diagnóstico" } : {})}
        />
        <KPICard label="Crias geradas" value={rep.total_crias ?? 0} />
        <KPICard
          label="Última utilização"
          value={rep.ultima_utilizacao ? formatRelativeTime(rep.ultima_utilizacao) : "—"}
        />
      </div>

      {/* ── Bloco 5: Histórico de inseminações ── */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-semibold text-ink" style={{ fontFamily: "var(--font-display)" }}>
            Últimas inseminações
          </h2>
          <Link
            to={`/inseminacao?reprodutor_id=${rep.id}`}
            className="text-[12px] text-green-700 hover:underline flex items-center gap-1"
          >
            Ver todas <ExternalLink size={11} />
          </Link>
        </div>

        {inseminacoes.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-2 text-center">
            <Syringe size={24} className="text-ink-4" />
            <p className="text-[13px] text-ink-3">Nenhuma inseminação registrada com este reprodutor.</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-line">
                    <th className="py-2 px-3 text-left text-[11px] font-semibold text-ink-4 uppercase tracking-[0.04em]">Data</th>
                    <th className="py-2 px-3 text-left text-[11px] font-semibold text-ink-4 uppercase tracking-[0.04em]">Matriz</th>
                    <th className="py-2 px-3 text-left text-[11px] font-semibold text-ink-4 uppercase tracking-[0.04em]">Tipo</th>
                    <th className="py-2 px-3 text-left text-[11px] font-semibold text-ink-4 uppercase tracking-[0.04em]">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {inseminacoes.map((ins) => (
                    <tr key={ins.id} className="border-b border-line last:border-0 hover:bg-beige/50 transition-colors">
                      <td className="py-2 px-3 text-[13px] text-ink-2">
                        {formatDate(ins.data_inseminacao)}
                      </td>
                      <td className="py-2 px-3">
                        <Link
                          to={`/animais/${ins.animal.id}`}
                          className="text-[13px] text-green-700 hover:underline"
                        >
                          {ins.animal.nome}
                        </Link>
                        <p className="text-[11px] font-mono text-ink-4">{ins.animal.codigo}</p>
                      </td>
                      <td className="py-2 px-3 text-[13px] text-ink-2">
                        {TIPO_LABEL[ins.tipo] ?? ins.tipo}
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant={RESULTADO_VARIANT[ins.resultado] as "ok" | "warn" | "danger" | "ghost"}>
                          {RESULTADO_LABEL[ins.resultado]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="flex flex-col gap-2 sm:hidden">
              {inseminacoes.map((ins) => (
                <div key={ins.id} className="flex items-center justify-between py-2 border-b border-line last:border-0">
                  <div>
                    <Link to={`/animais/${ins.animal.id}`} className="text-[13px] font-semibold text-green-700 hover:underline">
                      {ins.animal.nome}
                    </Link>
                    <p className="text-[11px] text-ink-4">
                      {formatDate(ins.data_inseminacao)} · {TIPO_LABEL[ins.tipo] ?? ins.tipo}
                    </p>
                  </div>
                  <Badge variant={RESULTADO_VARIANT[ins.resultado] as "ok" | "warn" | "danger" | "ghost"}>
                    {RESULTADO_LABEL[ins.resultado]}
                  </Badge>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* ── Modais ── */}
      <Modal04ReprodutorRapido
        open={showEdit}
        onClose={() => setShowEdit(false)}
        mode="edit"
        reprodutor={rep}
        onSave={() => setShowEdit(false)}
      />

      <Modal10DeleteConfirm
        open={showDelete}
        onClose={() => setShowDelete(false)}
        itemName={`reprodutor "${rep.nome}"`}
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />

      {showConfirmDesativar && (
        <ModalConfirmDesativar
          nome={rep.nome}
          onClose={() => setShowConfirmDesativar(false)}
          onConfirm={() => toggleMutation.mutate(false)}
        />
      )}

      {show409 && (
        <Modal409
          nome={rep.nome}
          total={rep.total_inseminacoes ?? 0}
          onClose={() => setShow409(false)}
          onDesativar={() => {
            toggleMutation.mutate(false);
            setShow409(false);
          }}
        />
      )}
    </div>
  );
}
