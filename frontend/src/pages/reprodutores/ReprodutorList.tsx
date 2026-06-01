import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Search, Plus, Eye, Trash2, Pencil, FlaskConical, FilterX,
  ArrowUpDown, ArrowUp, ArrowDown, Dna, ToggleLeft, ToggleRight,
  ChevronLeft, ChevronRight, Beef, X, RotateCcw, PawPrint,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { reprodutoresApi } from "@/lib/api/endpoints/reprodutores";
import { useDebounce } from "@/hooks/useDebounce";
import { Modal04ReprodutorRapido } from "@/components/modals/Modal04ReprodutorRapido";
import { Modal10DeleteConfirm } from "@/components/modals/Modal10DeleteConfirm";
import type { Reprodutor, Especie } from "@/types";

/* ── Constantes ─────────────────────────────────────────────────── */

const ESPECIE_EMOJI: Record<Especie, string> = { BOVINO: "🐄", OVINO: "🐑", CAPRINO: "🐐" };
const ESPECIE_LABEL: Record<Especie, string> = { BOVINO: "Bovino", OVINO: "Ovino", CAPRINO: "Caprino" };
const ESPECIE_VARIANT: Record<Especie, "bovino" | "ovino" | "caprino"> = {
  BOVINO: "bovino", OVINO: "ovino", CAPRINO: "caprino",
};

type TipoFilter = "SEMEN_EXTERNO" | "ANIMAL_PROPRIO" | "";
type StatusFilter = "true" | "false" | "";
type SortCol = "nome" | "especie" | "raca" | "dep_fertilidade" | "total_inseminacoes" | "taxa_prenhez";

const SS_KEY = "agrogen.reprodutoresFilters";
const RASCUNHO_PENDING_KEY = "agrogen.inseminacao.rascunho_pending";
const RASCUNHO_KEY = "agrogen.inseminacao.rascunho";

interface FiltersState {
  especie: Especie | "";
  tipo: TipoFilter;
  status: StatusFilter;
  sort: SortCol;
  order: "asc" | "desc";
  limit: 10 | 20 | 50;
}

function loadFilters(): FiltersState {
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    if (raw) return JSON.parse(raw) as FiltersState;
  } catch { /* noop */ }
  return { especie: "", tipo: "", status: "true", sort: "nome", order: "asc", limit: 20 };
}

/* ── Helpers visuais ─────────────────────────────────────────────── */

function tipoBadge(tipo: Reprodutor["tipo"]) {
  if (tipo === "SEMEN_EXTERNO") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-soft text-amber border border-amber/20">
        <FlaskConical size={10} /> Sêmen Externo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-700/[0.12] text-green-700 border border-green-700/20">
      <PawPrint size={10} /> Animal Próprio
    </span>
  );
}

function taxaBadge(taxa: number | undefined, total: number | undefined) {
  if (!total || total < 5) return <span className="text-ink-4 text-[13px]" title="Dados insuficientes">—</span>;
  const pct = Math.round((taxa ?? 0) * 100);
  const cls = pct >= 60 ? "text-ok font-semibold" : pct >= 40 ? "text-warn font-semibold" : "text-danger font-semibold";
  return <span className={cls}>{pct}%</span>;
}

/* ── Empty States ────────────────────────────────────────────────── */

function EmptyVazio({ onNovo, onPromover }: { onNovo: () => void; onPromover: () => void }) {
  return (
    <div className="flex flex-col items-center py-16 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-amber-soft flex items-center justify-center">
        <FlaskConical size={28} className="text-amber" />
      </div>
      <h3 className="text-[17px] font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
        Nenhum reprodutor cadastrado ainda
      </h3>
      <p className="text-[14px] text-ink-3 max-w-xs">
        Cadastre o sêmen externo que você utiliza ou promova um touro/macho do seu rebanho a reprodutor.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Button variant="primary" size="sm" onClick={onNovo}>
          <Plus size={15} /> Cadastrar sêmen externo
        </Button>
        <Button variant="secondary" size="sm" onClick={onPromover}>
          <Beef size={15} /> Promover animal do rebanho
        </Button>
      </div>
    </div>
  );
}

function EmptyFiltro({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center py-16 gap-4 text-center">
      <div className="w-14 h-14 rounded-full bg-beige flex items-center justify-center">
        <FilterX size={24} className="text-ink-3" />
      </div>
      <h3 className="text-[17px] font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
        Nenhum reprodutor encontrado com esses filtros
      </h3>
      <p className="text-[14px] text-ink-3">Tente ampliar os critérios de busca.</p>
      <Button variant="secondary" size="sm" onClick={onClear}>Limpar filtros</Button>
    </div>
  );
}

function EmptyEspecie({ especie, onCadastrar }: { especie: Especie; onCadastrar: () => void }) {
  return (
    <div className="flex flex-col items-center py-16 gap-4 text-center">
      <div className="w-14 h-14 rounded-full bg-beige flex items-center justify-center text-3xl">
        {ESPECIE_EMOJI[especie]}
      </div>
      <h3 className="text-[17px] font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
        Nenhum reprodutor {ESPECIE_LABEL[especie]} cadastrado
      </h3>
      <p className="text-[14px] text-ink-3 max-w-xs">
        Você precisará cadastrar pelo menos um reprodutor desta espécie antes de inseminar animais {ESPECIE_LABEL[especie]}.
      </p>
      <Button variant="primary" size="sm" onClick={onCadastrar}>
        <Plus size={15} /> Cadastrar reprodutor {ESPECIE_LABEL[especie]}
      </Button>
    </div>
  );
}

/* ── Sort header ─────────────────────────────────────────────────── */

function SortTh({ col, label, sort, order, onSort }: {
  col: SortCol; label: string; sort: SortCol; order: "asc" | "desc";
  onSort: (c: SortCol) => void;
}) {
  const isActive = sort === col;
  return (
    <th
      className="px-4 py-3 text-left text-[12px] font-semibold text-ink-2 uppercase tracking-[0.04em] cursor-pointer hover:text-ink select-none whitespace-nowrap"
      onClick={() => onSort(col)}
    >
      <span className="flex items-center gap-1">
        {label}
        {isActive
          ? (order === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)
          : <ArrowUpDown size={12} className="opacity-30" />}
      </span>
    </th>
  );
}

/* ── Mobile card ─────────────────────────────────────────────────── */

function ReprodutorCard({ rep, onView, onEdit, onToggle, onDelete }: {
  rep: Reprodutor; onView: () => void; onEdit: () => void;
  onToggle: () => void; onDelete: () => void;
}) {
  const barColor = rep.tipo === "SEMEN_EXTERNO" ? "bg-amber" : "bg-green-700";
  return (
    <Card padding="sm" className={`relative overflow-hidden ${!rep.ativo ? "opacity-60" : ""}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${barColor} rounded-l-[12px]`} />
      <div className="pl-3">
        <div className="flex items-start justify-between gap-2 cursor-pointer" onClick={onView}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[14px] font-semibold text-ink">{rep.nome}</p>
              {tipoBadge(rep.tipo)}
              {!rep.ativo && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-beige text-ink-4">
                  INATIVO
                </span>
              )}
            </div>
            <p className="text-[12px] text-ink-3 mt-0.5">
              {ESPECIE_EMOJI[rep.especie]} {ESPECIE_LABEL[rep.especie]} · {rep.raca}
              {rep.tipo === "SEMEN_EXTERNO" && rep.empresa_semen && ` · ${rep.empresa_semen}`}
            </p>
            {rep.dep_fertilidade !== undefined && (
              <p className="text-[12px] text-ink-3">DEP Fertilidade: {rep.dep_fertilidade.toFixed(2)}</p>
            )}
            <p className="text-[12px] text-ink-3">
              {rep.total_inseminacoes ?? 0} inseminações ·{" "}
              {rep.total_inseminacoes && rep.total_inseminacoes >= 5
                ? `${Math.round((rep.taxa_prenhez ?? 0) * 100)}% prenhez`
                : "poucos dados"}
            </p>
          </div>
        </div>
        <div className="flex gap-1 mt-2 pt-2 border-t border-line">
          <button onClick={onView} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[12px] text-ink-3 hover:text-ink hover:bg-beige rounded-[8px] transition-colors" aria-label="Ver perfil">
            <Eye size={13} /> Ver perfil
          </button>
          <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[12px] text-ink-3 hover:text-ink hover:bg-beige rounded-[8px] transition-colors" aria-label="Editar">
            <Pencil size={13} /> Editar
          </button>
          <button onClick={onToggle} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[12px] text-ink-3 hover:text-ink hover:bg-beige rounded-[8px] transition-colors" aria-label={rep.ativo ? "Desativar" : "Reativar"}>
            {rep.ativo ? <ToggleRight size={13} className="text-ok" /> : <ToggleLeft size={13} />}
            {rep.ativo ? "Desativar" : "Reativar"}
          </button>
          <button onClick={onDelete} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[12px] text-ink-3 hover:text-danger hover:bg-danger-bg rounded-[8px] transition-colors" aria-label="Excluir">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </Card>
  );
}

/* ── Modal de erro 409 ───────────────────────────────────────────── */

function Modal409({ rep, onClose, onDesativar }: {
  rep: Reprodutor; onClose: () => void; onDesativar: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface w-full flex flex-col rounded-t-[24px] md:rounded-[16px] md:max-w-md md:border md:border-line md:shadow-[var(--shadow-lg)] md:mx-4 max-h-[85dvh]">
        <div className="flex justify-center pt-3 pb-1 shrink-0 md:hidden">
          <div className="w-10 h-1 bg-line rounded-full" />
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-danger-bg flex items-center justify-center shrink-0">
              <Trash2 size={18} className="text-danger" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
                Este reprodutor não pode ser excluído
              </h3>
            </div>
          </div>
          <p className="text-[14px] text-ink-2">
            <strong>{rep.nome}</strong> está vinculado a{" "}
            <strong>{rep.total_inseminacoes ?? 0} inseminações</strong> no histórico do rebanho.
            Para preservar a integridade dos registros, reprodutores com histórico só podem ser{" "}
            <strong>DESATIVADOS</strong>.
          </p>
          <div className="flex flex-col gap-2 mt-2">
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

/* ── Confirmação de desativação ──────────────────────────────────── */

function ModalConfirmDesativar({ rep, onClose, onConfirm }: {
  rep: Reprodutor; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface w-full flex flex-col rounded-t-[24px] md:rounded-[16px] md:max-w-sm md:border md:border-line md:shadow-[var(--shadow-lg)] md:mx-4">
        <div className="flex justify-center pt-3 pb-1 shrink-0 md:hidden">
          <div className="w-10 h-1 bg-line rounded-full" />
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          <p className="text-[15px] font-semibold text-ink">Desativar {rep.nome}?</p>
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

/* ── Main Page ───────────────────────────────────────────────────── */

export function ReprodutorListPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<FiltersState>(loadFilters);
  const [page, setPage] = useState(1);
  const debouncedQ = useDebounce(q, 300);

  const [showModal04, setShowModal04] = useState(false);
  const [modal04Especie, setModal04Especie] = useState<Especie | undefined>(undefined);
  const [editRep, setEditRep] = useState<Reprodutor | null>(null);
  const [deleteRep, setDeleteRep] = useState<Reprodutor | null>(null);
  const [modal409Rep, setModal409Rep] = useState<Reprodutor | null>(null);
  const [confirmDesativarRep, setConfirmDesativarRep] = useState<Reprodutor | null>(null);

  const hasRascunho = sessionStorage.getItem(RASCUNHO_PENDING_KEY) === "true";

  useEffect(() => {
    sessionStorage.setItem(SS_KEY, JSON.stringify(filters));
  }, [filters]);

  const setFilter = useCallback(<K extends keyof FiltersState>(key: K, val: FiltersState[K]) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(1);
  }, []);

  const hasActiveFilters =
    filters.especie !== "" || filters.tipo !== "" || filters.status !== "true" || debouncedQ !== "";

  const clearFilters = () => {
    setQ("");
    setFilters((f) => ({ ...f, especie: "", tipo: "", status: "true" }));
    setPage(1);
  };

  const handleSort = (col: SortCol) => {
    setFilters((f) => ({
      ...f,
      sort: col,
      order: f.sort === col && f.order === "asc" ? "desc" : "asc",
    }));
    setPage(1);
  };

  const queryParams: import("@/lib/api/endpoints/reprodutores").ReprodutoresParams = {
    ...(debouncedQ ? { q: debouncedQ } : {}),
    ...(filters.especie ? { especie: filters.especie } : {}),
    ...(filters.tipo ? { tipo: filters.tipo as "SEMEN_EXTERNO" | "ANIMAL_PROPRIO" } : {}),
    ...(filters.status !== "" ? { ativo: filters.status === "true" } : {}),
    page,
    limit: filters.limit,
    sort: filters.sort,
    order: filters.order,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["reprodutores", queryParams],
    queryFn: () => reprodutoresApi.listar(queryParams),
  });

  const { data: countsData } = useQuery({
    queryKey: ["reprodutores", "counts"],
    queryFn: () => reprodutoresApi.listar({ limit: 999 }),
    staleTime: 30_000,
  });

  const allReps = countsData?.data ?? [];
  const counts = {
    total: allReps.length,
    bovino: allReps.filter((r) => r.especie === "BOVINO").length,
    ovino: allReps.filter((r) => r.especie === "OVINO").length,
    caprino: allReps.filter((r) => r.especie === "CAPRINO").length,
    semen: allReps.filter((r) => r.tipo === "SEMEN_EXTERNO").length,
    proprio: allReps.filter((r) => r.tipo === "ANIMAL_PROPRIO").length,
    ativos: allReps.filter((r) => r.ativo).length,
    inativos: allReps.filter((r) => !r.ativo).length,
  };

  const reprodutores = data?.data ?? [];
  const meta = data?.meta;

  const toggleMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      reprodutoresApi.atualizar(id, { ativo }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["reprodutores"] });
      setConfirmDesativarRep(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reprodutoresApi.deletar(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["reprodutores"] });
      setDeleteRep(null);
    },
    onError: (err: { response?: { status?: number; data?: { error?: { total_inseminacoes?: number } } } }, id) => {
      if (err?.response?.status === 409) {
        const rep = reprodutores.find((r) => r.id === id) ?? deleteRep;
        if (rep) setModal409Rep(rep);
        setDeleteRep(null);
      }
    },
  });

  const handleToggle = (rep: Reprodutor) => {
    if (rep.ativo) {
      setConfirmDesativarRep(rep);
    } else {
      toggleMutation.mutate({ id: rep.id, ativo: true });
    }
  };

  const handleNovoReprodutor = (especie?: Especie) => {
    setModal04Especie(especie);
    setEditRep(null);
    setShowModal04(true);
  };

  const handleRetornarRascunho = () => {
    sessionStorage.removeItem(RASCUNHO_PENDING_KEY);
    navigate("/inseminacao");
  };

  const descartarRascunho = () => {
    sessionStorage.removeItem(RASCUNHO_PENDING_KEY);
    sessionStorage.removeItem(RASCUNHO_KEY);
    window.location.reload();
  };

  /* ── Chips de filtro ── */
  const especieChips: { label: string; value: Especie | "" }[] = [
    { label: `Todos (${counts.total})`, value: "" },
    { label: `🐄 Bovino (${counts.bovino})`, value: "BOVINO" },
    { label: `🐑 Ovino (${counts.ovino})`, value: "OVINO" },
    { label: `🐐 Caprino (${counts.caprino})`, value: "CAPRINO" },
  ];
  const tipoChips: { label: string; value: TipoFilter }[] = [
    { label: `Todos (${counts.semen + counts.proprio})`, value: "" },
    { label: `Sêmen Externo (${counts.semen})`, value: "SEMEN_EXTERNO" },
    { label: `Animal Próprio (${counts.proprio})`, value: "ANIMAL_PROPRIO" },
  ];
  const statusChips: { label: string; value: StatusFilter }[] = [
    { label: `Ativos (${counts.ativos})`, value: "true" },
    { label: `Inativos (${counts.inativos})`, value: "false" },
    { label: `Todos (${counts.total})`, value: "" },
  ];

  /* ── Determinar qual empty state usar ── */
  const isEmpty = !isLoading && reprodutores.length === 0;
  const isGlobalEmpty = isEmpty && !hasActiveFilters && counts.total === 0;
  const isEspecieEmpty = isEmpty && filters.especie !== "" && !filters.tipo && !filters.status && !debouncedQ;

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6 flex flex-col gap-5">

      {/* Banner FLUXO-14 */}
      {hasRascunho && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-soft border border-amber/30 rounded-[12px]">
          <div className="flex items-center gap-2 text-[13px] text-amber font-medium">
            <RotateCcw size={15} />
            Você estava registrando uma inseminação.
            <button onClick={handleRetornarRascunho} className="underline font-semibold hover:opacity-80">
              Retomar →
            </button>
          </div>
          <button onClick={descartarRascunho} className="text-ink-4 hover:text-ink" aria-label="Descartar rascunho">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
            Reprodutores
          </h1>
          <p className="text-[13px] text-ink-3">Catálogo de sêmen externo e animais próprios promovidos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate("/animais?promover=1")}>
            <Beef size={15} /> Promover animal
          </Button>
          <Button variant="primary" size="sm" onClick={() => handleNovoReprodutor()}>
            <Plus size={15} /> Novo Reprodutor
          </Button>
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar por nome ou registro (ABCZ, ARCO...)"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          className="w-full pl-9 pr-9 py-2.5 text-[14px] bg-surface border border-line rounded-[10px] text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700"
        />
        {q && (
          <button
            onClick={() => { setQ(""); setPage(1); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink"
            aria-label="Limpar busca"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Filtros chips */}
      <div className="flex flex-col gap-2">
        {/* Espécie */}
        <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none]">
          <span className="text-[11px] font-semibold text-ink-4 uppercase tracking-[0.06em] shrink-0">Espécie</span>
          {especieChips.map((chip) => (
            <button
              key={chip.value}
              onClick={() => setFilter("especie", chip.value)}
              className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                filters.especie === chip.value
                  ? "bg-green-700 text-white"
                  : "bg-beige text-ink-2 hover:bg-green-700/10 hover:text-green-700"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
        {/* Tipo */}
        <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none]">
          <span className="text-[11px] font-semibold text-ink-4 uppercase tracking-[0.06em] shrink-0">Tipo</span>
          {tipoChips.map((chip) => (
            <button
              key={chip.value}
              onClick={() => setFilter("tipo", chip.value)}
              className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                filters.tipo === chip.value
                  ? "bg-green-700 text-white"
                  : "bg-beige text-ink-2 hover:bg-green-700/10 hover:text-green-700"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
        {/* Status */}
        <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none]">
          <span className="text-[11px] font-semibold text-ink-4 uppercase tracking-[0.06em] shrink-0">Status</span>
          {statusChips.map((chip) => (
            <button
              key={chip.value}
              onClick={() => setFilter("status", chip.value)}
              className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                filters.status === chip.value
                  ? "bg-green-700 text-white"
                  : "bg-beige text-ink-2 hover:bg-green-700/10 hover:text-green-700"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="self-start flex items-center gap-1.5 text-[12px] text-ink-3 hover:text-danger transition-colors"
          >
            <FilterX size={13} /> Limpar filtros
          </button>
        )}
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-ink-3">
            <Dna size={20} className="animate-spin" />
            <span className="text-[14px]">Carregando reprodutores...</span>
          </div>
        </div>
      ) : isGlobalEmpty ? (
        <EmptyVazio onNovo={() => handleNovoReprodutor()} onPromover={() => navigate("/animais?promover=1")} />
      ) : isEspecieEmpty ? (
        <EmptyEspecie especie={filters.especie as Especie} onCadastrar={() => handleNovoReprodutor(filters.especie as Especie)} />
      ) : isEmpty ? (
        <EmptyFiltro onClear={clearFilters} />
      ) : (
        <>
          {/* Tabela desktop */}
          <div className="hidden md:block">
            <Card padding="sm" className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-beige border-b border-line">
                    <tr>
                      <SortTh col="nome" label="Identificação" sort={filters.sort} order={filters.order} onSort={handleSort} />
                      <SortTh col="especie" label="Espécie" sort={filters.sort} order={filters.order} onSort={handleSort} />
                      <SortTh col="raca" label="Raça" sort={filters.sort} order={filters.order} onSort={handleSort} />
                      <th className="px-4 py-3 text-left text-[12px] font-semibold text-ink-2 uppercase tracking-[0.04em]">Origem</th>
                      <SortTh col="dep_fertilidade" label="DEP Fert." sort={filters.sort} order={filters.order} onSort={handleSort} />
                      <SortTh col="total_inseminacoes" label="Insem." sort={filters.sort} order={filters.order} onSort={handleSort} />
                      <SortTh col="taxa_prenhez" label="Taxa prenhez" sort={filters.sort} order={filters.order} onSort={handleSort} />
                      <th className="px-4 py-3 text-left text-[12px] font-semibold text-ink-2 uppercase tracking-[0.04em]">Status</th>
                      <th className="px-4 py-3 text-right text-[12px] font-semibold text-ink-2 uppercase tracking-[0.04em]">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reprodutores.map((rep, idx) => (
                      <tr
                        key={rep.id}
                        className={`border-b border-line last:border-0 hover:bg-beige/60 transition-colors ${!rep.ativo ? "opacity-60" : ""} ${idx % 2 === 1 ? "bg-beige/30" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-8 rounded-full shrink-0 ${rep.tipo === "SEMEN_EXTERNO" ? "bg-amber" : "bg-green-700"}`} />
                            <div>
                              <button
                                onClick={() => navigate(`/reprodutores/${rep.id}`)}
                                className="text-[13px] font-semibold text-ink hover:text-green-700 transition-colors text-left"
                              >
                                {rep.nome}
                              </button>
                              {rep.registro && (
                                <p className="text-[11px] font-mono text-ink-4">{rep.registro}</p>
                              )}
                            </div>
                          </div>
                          <div className="ml-3.5 mt-0.5">{tipoBadge(rep.tipo)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={ESPECIE_VARIANT[rep.especie]}>
                            {ESPECIE_EMOJI[rep.especie]} {ESPECIE_LABEL[rep.especie]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-ink-2">{rep.raca}</td>
                        <td className="px-4 py-3 text-[13px] text-ink-2">
                          {rep.tipo === "SEMEN_EXTERNO" ? (
                            rep.empresa_semen ?? "—"
                          ) : (
                            rep.animal_id ? (
                              <button
                                onClick={() => navigate(`/animais/${rep.animal_id}`)}
                                className="text-green-700 hover:underline font-mono text-[12px]"
                              >
                                Ver animal →
                              </button>
                            ) : "—"
                          )}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-ink-2">
                          {rep.dep_fertilidade !== undefined ? rep.dep_fertilidade.toFixed(2) : "—"}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-ink-2">
                          {rep.total_inseminacoes ?? 0}
                        </td>
                        <td className="px-4 py-3">
                          {taxaBadge(rep.taxa_prenhez, rep.total_inseminacoes)}
                        </td>
                        <td className="px-4 py-3">
                          {rep.ativo ? (
                            <Badge variant="ok">ATIVO</Badge>
                          ) : (
                            <Badge variant="ghost">INATIVO</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/reprodutores/${rep.id}`)}
                              className="w-8 h-8 flex items-center justify-center rounded-[8px] text-ink-3 hover:bg-beige hover:text-ink transition-colors"
                              aria-label="Ver perfil"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              onClick={() => { setEditRep(rep); setShowModal04(true); }}
                              className="w-8 h-8 flex items-center justify-center rounded-[8px] text-ink-3 hover:bg-beige hover:text-ink transition-colors"
                              aria-label="Editar"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleToggle(rep)}
                              className="w-8 h-8 flex items-center justify-center rounded-[8px] text-ink-3 hover:bg-beige hover:text-ink transition-colors"
                              aria-label={rep.ativo ? "Desativar" : "Reativar"}
                            >
                              {rep.ativo
                                ? <ToggleRight size={15} className="text-ok" />
                                : <ToggleLeft size={15} />}
                            </button>
                            <button
                              onClick={() => setDeleteRep(rep)}
                              className="w-8 h-8 flex items-center justify-center rounded-[8px] text-ink-3 hover:bg-danger-bg hover:text-danger transition-colors"
                              aria-label="Excluir"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Cards mobile */}
          <div className="flex flex-col gap-3 md:hidden">
            {reprodutores.map((rep) => (
              <ReprodutorCard
                key={rep.id}
                rep={rep}
                onView={() => navigate(`/reprodutores/${rep.id}`)}
                onEdit={() => { setEditRep(rep); setShowModal04(true); }}
                onToggle={() => handleToggle(rep)}
                onDelete={() => setDeleteRep(rep)}
              />
            ))}
          </div>

          {/* Paginação */}
          {meta && (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-[13px] text-ink-3">
                Exibindo <strong>{reprodutores.length}</strong> de <strong>{meta.total}</strong> reprodutores
              </p>
              <div className="flex items-center gap-2">
                <select
                  value={filters.limit}
                  onChange={(e) => setFilter("limit", Number(e.target.value) as 10 | 20 | 50)}
                  className="text-[13px] bg-surface border border-line rounded-[8px] px-2 py-1.5 text-ink"
                >
                  <option value={10}>10 por página</option>
                  <option value={20}>20 por página</option>
                  <option value={50}>50 por página</option>
                </select>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!meta.has_prev}
                  className="w-8 h-8 flex items-center justify-center rounded-[8px] border border-line text-ink-3 hover:bg-beige disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="text-[13px] text-ink-2 font-medium px-1">
                  {meta.page} / {meta.total_pages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!meta.has_next}
                  className="w-8 h-8 flex items-center justify-center rounded-[8px] border border-line text-ink-3 hover:bg-beige disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Próxima página"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modais */}
      <Modal04ReprodutorRapido
        open={showModal04}
        onClose={() => { setShowModal04(false); setEditRep(null); setModal04Especie(undefined); }}
        onSave={() => {
          void qc.invalidateQueries({ queryKey: ["reprodutores"] });
          setShowModal04(false);
          setEditRep(null);
        }}
        mode={editRep ? "edit" : "create"}
        {...(editRep ? { reprodutor: editRep } : {})}
        {...(modal04Especie ? { especiePreferida: modal04Especie } : {})}
      />

      {deleteRep && (
        <Modal10DeleteConfirm
          open={!!deleteRep}
          onClose={() => setDeleteRep(null)}
          itemName={`reprodutor "${deleteRep.nome}"`}
          onConfirm={() => {
            if (deleteRep) deleteMutation.mutate(deleteRep.id);
          }}
          loading={deleteMutation.isPending}
        />
      )}

      {modal409Rep && (
        <Modal409
          rep={modal409Rep}
          onClose={() => setModal409Rep(null)}
          onDesativar={() => {
            toggleMutation.mutate({ id: modal409Rep.id, ativo: false });
            setModal409Rep(null);
          }}
        />
      )}

      {confirmDesativarRep && (
        <ModalConfirmDesativar
          rep={confirmDesativarRep}
          onClose={() => setConfirmDesativarRep(null)}
          onConfirm={() => toggleMutation.mutate({ id: confirmDesativarRep.id, ativo: false })}
        />
      )}
    </div>
  );
}
