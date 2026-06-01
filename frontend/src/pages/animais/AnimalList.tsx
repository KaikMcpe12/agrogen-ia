import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Search, Plus, SlidersHorizontal, Eye, Trash2, Pencil, Syringe,
         ArrowUpDown, ArrowUp, ArrowDown, PawPrint, FilterX, FileUp, Dna } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { animaisApi } from "@/lib/api/endpoints/animais";
import { useDebounce } from "@/hooks/useDebounce";
import { Modal01NewAnimalStep1, type Step1Data } from "@/components/modals/Modal01NewAnimalStep1";
import { Modal02NewAnimalStep2 } from "@/components/modals/Modal02NewAnimalStep2";
import { Modal10DeleteConfirm } from "@/components/modals/Modal10DeleteConfirm";
import { ModalNewAnimalSelector } from "@/components/modals/ModalNewAnimalSelector";
import type { Animal, Especie, StatusAnimal } from "@/types";

/* ── Constantes ────────────────────────────────────────────────── */

const ESPECIE_LABELS: Record<Especie, string> = { BOVINO: "🐄 Bovino", OVINO: "🐑 Ovino", CAPRINO: "🐐 Caprino" };
const ESPECIE_VARIANT: Record<Especie, "bovino" | "ovino" | "caprino"> = { BOVINO: "bovino", OVINO: "ovino", CAPRINO: "caprino" };

const STATUS_LABELS: Record<StatusAnimal, string> = {
  ATIVA: "Ativa", PRENHA: "Prenha", EM_REPOUSO: "Em repouso", DESCARTADA: "Descartada",
  REPRODUTOR_ATIVO: "Reprodutor", EM_MONITORAMENTO: "Monitoramento",
};
const STATUS_VARIANT: Record<StatusAnimal, "ok" | "info" | "ghost" | "danger" | "bovino" | "warn"> = {
  ATIVA: "ok", PRENHA: "info", EM_REPOUSO: "warn", DESCARTADA: "danger",
  REPRODUTOR_ATIVO: "bovino", EM_MONITORAMENTO: "warn",
};

type SortCol = "codigo" | "nome" | "especie" | "raca_principal" | "sexo" | "status" | "condicao_corporal";

const SS_KEY = "agrogen.animaisFilters";

interface FiltersState {
  especie: Especie | "";
  status: StatusAnimal | "";
  sort: SortCol;
  order: "asc" | "desc";
  limit: 10 | 20 | 50;
}

function loadFilters(): FiltersState {
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    if (raw) return JSON.parse(raw) as FiltersState;
  } catch { /* noop */ }
  return { especie: "", status: "", sort: "nome", order: "asc", limit: 20 };
}

/* ── Empty States ──────────────────────────────────────────────── */

function EmptyListaVazia({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center py-16 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
        <PawPrint size={28} className="text-green-700" />
      </div>
      <h3 className="text-[17px] font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
        Nenhum animal cadastrado ainda
      </h3>
      <p className="text-[14px] text-ink-3 max-w-xs">
        Adicione seu primeiro animal manualmente ou importe um lote via CSV.
      </p>
      <div className="flex gap-3">
        <Button variant="primary" size="sm" onClick={onNew}>
          <Plus size={15} /> Novo Animal
        </Button>
        <Button variant="secondary" size="sm">
          <FileUp size={15} /> Importar CSV
        </Button>
      </div>
    </div>
  );
}

function EmptyFiltroSemResultado({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center py-16 gap-4 text-center">
      <div className="w-14 h-14 rounded-full bg-beige flex items-center justify-center">
        <FilterX size={24} className="text-ink-3" />
      </div>
      <h3 className="text-[17px] font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
        Nenhum animal corresponde aos filtros
      </h3>
      <p className="text-[14px] text-ink-3">Tente ampliar os critérios de busca.</p>
      <Button variant="secondary" size="sm" onClick={onClear}>
        Limpar filtros
      </Button>
    </div>
  );
}

/* ── Sort header cell ──────────────────────────────────────────── */

function SortTh({ col, label, sort, order, onSort }: {
  col: SortCol; label: string; sort: SortCol; order: "asc" | "desc";
  onSort: (c: SortCol) => void;
}) {
  const isActive = sort === col;
  return (
    <th
      className="px-4 py-3 text-left text-[12px] font-semibold text-ink-2 uppercase tracking-[0.04em] cursor-pointer hover:text-ink select-none"
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

/* ── Mobile card ───────────────────────────────────────────────── */

function AnimalCard({ animal, onView, onEdit, onInseminar, onDelete }: {
  animal: Animal; onView: () => void; onEdit: () => void;
  onInseminar: () => void; onDelete: () => void;
}) {
  return (
    <Card padding="sm" className={`${animal.status === "DESCARTADA" ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-3" onClick={onView} style={{ cursor: "pointer" }}>
        <div className="w-10 h-10 rounded-[10px] bg-green-100 flex items-center justify-center text-lg shrink-0">
          {animal.especie === "BOVINO" ? "🐄" : animal.especie === "OVINO" ? "🐑" : "🐐"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[14px] font-semibold text-ink truncate">{animal.nome}</p>
            <Badge variant={STATUS_VARIANT[animal.status]}>{STATUS_LABELS[animal.status]}</Badge>
          </div>
          <p className="text-[12px] font-mono text-ink-4">{animal.codigo} · {animal.raca_principal}</p>
        </div>
      </div>
      <div className="flex gap-1 mt-2 pt-2 border-t border-line">
        <button onClick={onView} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[12px] text-ink-3 hover:text-ink hover:bg-beige rounded-[8px] transition-colors" aria-label="Ver perfil">
          <Eye size={13} /> Ver
        </button>
        <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[12px] text-ink-3 hover:text-ink hover:bg-beige rounded-[8px] transition-colors" aria-label="Editar animal">
          <Pencil size={13} /> Editar
        </button>
        {animal.sexo === "FEMEA" && animal.status !== "DESCARTADA" && (
          <button onClick={onInseminar} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[12px] text-green-700 hover:bg-green-100 rounded-[8px] transition-colors" aria-label="Registrar inseminação">
            <Syringe size={13} /> Inseminar
          </button>
        )}
        <button onClick={onDelete} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[12px] text-ink-3 hover:text-danger hover:bg-danger-bg rounded-[8px] transition-colors" aria-label="Excluir animal">
          <Trash2 size={13} /> Excluir
        </button>
      </div>
    </Card>
  );
}

/* ── Main Page ─────────────────────────────────────────────────── */

export function AnimalListPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<FiltersState>(loadFilters);
  const [page, setPage] = useState(1);
  const debouncedQ = useDebounce(q, 300);

  // Modais
  const [showSelectorModal, setShowSelectorModal] = useState(false);
  const [showModal01, setShowModal01] = useState(false);
  const [showModal02, setShowModal02] = useState(false);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [editAnimal, setEditAnimal] = useState<Animal | null>(null);
  const [deleteAnimal, setDeleteAnimal] = useState<Animal | null>(null);

  // Persiste filtros no sessionStorage
  useEffect(() => {
    sessionStorage.setItem(SS_KEY, JSON.stringify(filters));
  }, [filters]);

  const setFilter = useCallback(<K extends keyof FiltersState>(key: K, val: FiltersState[K]) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(1);
  }, []);

  const hasActiveFilters = filters.especie !== "" || filters.status !== "" || debouncedQ !== "";

  const clearFilters = () => {
    setQ("");
    setFilters((f) => ({ ...f, especie: "", status: "" }));
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

  // Query principal
  const { data, isLoading } = useQuery({
    queryKey: ["animais", debouncedQ, filters.especie, filters.status, filters.sort, filters.order, filters.limit, page],
    queryFn: () =>
      animaisApi.listar({
        q: debouncedQ || undefined,
        especie: filters.especie || undefined,
        status: filters.status || undefined,
        sort: filters.sort,
        order: filters.order,
        page,
        limit: filters.limit,
      }),
  });

  // Contagens para chips (stale OK)
  const { data: countsData } = useQuery({
    queryKey: ["animais-counts"],
    queryFn: animaisApi.counts,
    staleTime: 2 * 60 * 1000,
  });
  const counts = countsData?.data;

  const animais = data?.data ?? [];
  const meta = data?.meta;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => animaisApi.deletar(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["animais"] });
      void qc.invalidateQueries({ queryKey: ["animais-counts"] });
      setDeleteAnimal(null);
    },
  });

  // Ação "Registrar inseminação" com animal pré-selecionado (Adendo FLUXO-08 referência TELA-02)
  const handleInseminar = (animal: Animal) => {
    void navigate(`/inseminacao?animal_id=${animal.id}`);
  };

  // Abrir edição
  const openEdit = (animal: Animal) => {
    setEditAnimal(animal);
    setStep1Data({
      especie: animal.especie,
      nome: animal.nome,
      sexo: animal.sexo,
      data_nascimento: animal.data_nascimento.split("T")[0]!,
      peso_inicial_kg: animal.peso_inicial_kg,
      condicao_corporal: animal.condicao_corporal,
    });
    setShowModal01(true);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6 flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>Animais</h1>
          {meta && (
            <p className="text-[13px] text-ink-3 mt-0.5">
              Exibindo {(page - 1) * filters.limit + 1}–{Math.min(page * filters.limit, meta.total)} de {meta.total} animais
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => void navigate("/reprodutores")}>
            <Dna size={15} /> Reprodutores
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowSelectorModal(true)}>
            <Plus size={16} /> Novo Animal
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Buscar por nome, código ou brinco…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            leftIcon={<Search size={16} />}
          />
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-[10px] border border-line bg-surface text-[14px] font-medium text-ink-3 hover:bg-beige transition-colors min-h-[44px]"
          aria-label="Filtros avançados"
        >
          <SlidersHorizontal size={16} />
          Filtros avançados
        </button>
      </div>

      {/* Chips de espécie */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: "" as const, label: "Todos", count: counts?.total },
          { key: "BOVINO" as Especie, label: "🐄 Bovino", count: counts?.bovino },
          { key: "OVINO" as Especie, label: "🐑 Ovino", count: counts?.ovino },
          { key: "CAPRINO" as Especie, label: "🐐 Caprino", count: counts?.caprino },
        ] as { key: Especie | ""; label: string; count: number | undefined }[]).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter("especie", key)}
            className={[
              "px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors",
              filters.especie === key
                ? "bg-green-900 text-white border-green-900"
                : "bg-surface text-ink-3 border-line hover:bg-beige",
            ].join(" ")}
          >
            {label}
            {count !== undefined && (
              <span className={`ml-1.5 text-[11px] ${filters.especie === key ? "opacity-80" : "text-ink-4"}`}>
                ({count})
              </span>
            )}
          </button>
        ))}

        <span className="w-px bg-line mx-1" />

        {/* Chips de status */}
        {([
          { key: "" as const, label: "Todos os status" },
          { key: "ATIVA" as StatusAnimal, label: "Ativa", count: counts?.ativa },
          { key: "PRENHA" as StatusAnimal, label: "Prenha", count: counts?.prenha },
          { key: "EM_REPOUSO" as StatusAnimal, label: "Em repouso", count: counts?.em_repouso },
          { key: "DESCARTADA" as StatusAnimal, label: "Descartada", count: counts?.descartada },
        ] as { key: StatusAnimal | ""; label: string; count?: number }[]).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter("status", key)}
            className={[
              "px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors",
              filters.status === key
                ? "bg-green-900 text-white border-green-900"
                : "bg-surface text-ink-3 border-line hover:bg-beige",
            ].join(" ")}
          >
            {label}
            {count !== undefined && (
              <span className={`ml-1.5 text-[11px] ${filters.status === key ? "opacity-80" : "text-ink-4"}`}>
                ({count})
              </span>
            )}
          </button>
        ))}

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-1.5 rounded-full text-[13px] font-medium border border-danger text-danger bg-danger-bg hover:bg-danger-bg/80 transition-colors flex items-center gap-1.5"
          >
            <FilterX size={13} /> Limpar filtros
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="h-16 animate-pulse bg-beige">{null}</Card>
          ))}
        </div>
      ) : animais.length === 0 ? (
        hasActiveFilters
          ? <EmptyFiltroSemResultado onClear={clearFilters} />
          : <EmptyListaVazia onNew={() => setShowSelectorModal(true)} />
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {animais.map((a) => (
              <AnimalCard
                key={a.id}
                animal={a}
                onView={() => void navigate(`/animais/${a.id}`)}
                onEdit={() => openEdit(a)}
                onInseminar={() => handleInseminar(a)}
                onDelete={() => setDeleteAnimal(a)}
              />
            ))}
          </div>

          {/* Desktop: tabela com sort */}
          <div className="hidden md:block overflow-hidden rounded-[18px] border border-line bg-surface">
            <table className="w-full">
              <thead>
                <tr className="bg-beige border-b border-line">
                  <SortTh col="codigo"          label="Código"   sort={filters.sort} order={filters.order} onSort={handleSort} />
                  <SortTh col="nome"            label="Nome"     sort={filters.sort} order={filters.order} onSort={handleSort} />
                  <SortTh col="especie"         label="Espécie"  sort={filters.sort} order={filters.order} onSort={handleSort} />
                  <SortTh col="raca_principal"  label="Raça"     sort={filters.sort} order={filters.order} onSort={handleSort} />
                  <SortTh col="sexo"            label="Sexo"     sort={filters.sort} order={filters.order} onSort={handleSort} />
                  <SortTh col="status"          label="Status"   sort={filters.sort} order={filters.order} onSort={handleSort} />
                  <SortTh col="condicao_corporal" label="CC"     sort={filters.sort} order={filters.order} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-ink-2 uppercase tracking-[0.04em]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {animais.map((a) => (
                  <tr
                    key={a.id}
                    className={`border-b border-line hover:bg-beige/50 transition-colors cursor-pointer ${a.status === "DESCARTADA" ? "opacity-50" : ""}`}
                    onClick={() => void navigate(`/animais/${a.id}`)}
                  >
                    <td className="px-4 py-3"><span className="text-[12px] font-mono text-ink-3">{a.codigo}</span></td>
                    <td className="px-4 py-3 font-medium text-[14px] text-ink">{a.nome}</td>
                    <td className="px-4 py-3"><Badge variant={ESPECIE_VARIANT[a.especie]}>{ESPECIE_LABELS[a.especie]}</Badge></td>
                    <td className="px-4 py-3 text-[13px] text-ink-2">{a.raca_principal}</td>
                    <td className="px-4 py-3 text-[13px] text-ink-3">{a.sexo === "FEMEA" ? "♀ Fêmea" : "♂ Macho"}</td>
                    <td className="px-4 py-3"><Badge variant={STATUS_VARIANT[a.status]}>{STATUS_LABELS[a.status]}</Badge></td>
                    <td className="px-4 py-3 text-[13px] text-ink-3">{a.condicao_corporal}/5</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button onClick={() => void navigate(`/animais/${a.id}`)} className="w-8 h-8 flex items-center justify-center rounded-[8px] text-ink-4 hover:bg-beige" aria-label="Ver perfil"><Eye size={14} /></button>
                        <button onClick={() => openEdit(a)} className="w-8 h-8 flex items-center justify-center rounded-[8px] text-ink-4 hover:bg-beige" aria-label="Editar animal"><Pencil size={14} /></button>
                        {a.sexo === "FEMEA" && a.status !== "DESCARTADA" && (
                          <button onClick={() => handleInseminar(a)} className="w-8 h-8 flex items-center justify-center rounded-[8px] text-green-700 hover:bg-green-100" aria-label="Registrar inseminação"><Syringe size={14} /></button>
                        )}
                        <button onClick={() => setDeleteAnimal(a)} className="w-8 h-8 flex items-center justify-center rounded-[8px] text-ink-4 hover:bg-danger-bg hover:text-danger" aria-label="Excluir animal"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação + seletor de limite */}
          {meta && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-ink-3">Itens por página:</span>
                {([10, 20, 50] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => { setFilter("limit", l); setPage(1); }}
                    className={[
                      "px-2.5 py-1 rounded-[8px] text-[13px] font-medium transition-colors",
                      filters.limit === l ? "bg-green-700 text-white" : "text-ink-3 hover:bg-beige",
                    ].join(" ")}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {meta.total_pages > 1 && (
                <div className="flex items-center gap-3">
                  <p className="text-[13px] text-ink-3">
                    Página {meta.page} de {meta.total_pages}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" disabled={!meta.has_prev} onClick={() => setPage((p) => p - 1)}>← Anterior</Button>
                    <Button variant="secondary" size="sm" disabled={!meta.has_next} onClick={() => setPage((p) => p + 1)}>Próxima →</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal Novo Animal — seletor de modo (tradicional ou chat) */}
      <ModalNewAnimalSelector
        open={showSelectorModal}
        onClose={() => setShowSelectorModal(false)}
      />

      {/* Modal Editar Animal (edit) */}
      {editAnimal && (
        <Modal01NewAnimalStep1
          open={showModal01}
          onClose={() => { setShowModal01(false); setEditAnimal(null); }}
          onNext={(data) => { setStep1Data(data); setShowModal01(false); setShowModal02(true); }}
          mode="edit"
          animal={editAnimal}
        />
      )}
      {editAnimal && (
        <Modal02NewAnimalStep2
          open={showModal02}
          onClose={() => { setShowModal02(false); setEditAnimal(null); setStep1Data(null); }}
          onBack={() => { setShowModal02(false); setShowModal01(true); }}
          step1Data={step1Data}
          mode="edit"
          animal={editAnimal}
        />
      )}

      {/* Modal Excluir */}
      <Modal10DeleteConfirm
        open={!!deleteAnimal}
        onClose={() => setDeleteAnimal(null)}
        itemName={deleteAnimal?.nome ?? ""}
        onConfirm={() => {
          const id = deleteAnimal?.id;
          if (id) deleteMutation.mutate(id);
        }}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
