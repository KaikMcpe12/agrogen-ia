import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { animaisApi } from "@/lib/api/endpoints/animais";
import { diarioApi } from "@/lib/api/endpoints/diario";
import { useDebounce } from "@/hooks/useDebounce";
import { useChartTheme } from "@/hooks/useChartTheme";
import { Modal06Pesagem } from "@/components/modals/Modal06Pesagem";
import { Modal07Parto } from "@/components/modals/Modal07Parto";
import { Modal08Sanitario } from "@/components/modals/Modal08Sanitario";
import { Modal09Ocorrencia } from "@/components/modals/Modal09Ocorrencia";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Animal, Pesagem, Parto, EventoSanitario } from "@/types";

type Tab = "peso" | "paricao" | "sanitario" | "ocorrencias";

const ESTAGIO_LABELS: Record<string, string> = {
  NASCIMENTO: "Nascimento",
  DESMAME: "Desmame",
  CRESCIMENTO: "Crescimento",
  ADULTO: "Adulto",
  ABATE: "Abate",
};

const TIPO_PARTO_LABELS: Record<string, string> = {
  SIMPLES: "Simples",
  DUPLO: "Duplo",
  MULTIPLO: "Múltiplo",
};

const SANITARIO_TIPO_LABELS: Record<string, string> = {
  VACINA: "Vacina",
  VERMIFUGACAO: "Vermifugação",
  MEDICACAO: "Medicação",
  EXAME: "Exame",
};

const CATEGORIA_LABELS: Record<string, string> = {
  SAUDE: "Saúde",
  MANEJO: "Manejo",
  COMPORTAMENTO: "Comportamento",
  OUTRO: "Outro",
};

// ── Mobile card components ──────────────────────────────────────

function PesagemCard({ p }: { p: Pesagem }) {
  return (
    <div className="rounded-[14px] border border-line bg-surface p-4 flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[18px] font-bold text-ink">{p.peso_kg} kg</p>
          <p className="text-[12px] text-ink-3">{ESTAGIO_LABELS[p.estagio] ?? p.estagio}</p>
        </div>
        <p className="text-[13px] text-ink-2">{new Date(p.data).toLocaleDateString("pt-BR")}</p>
      </div>
      {p.gmd_calculado !== undefined && (
        <p className="text-[13px] text-ink-3">
          GMD: <strong className="text-ink">{p.gmd_calculado} kg/dia</strong>
        </p>
      )}
      {p.observacao && <p className="text-[12px] text-ink-4">{p.observacao}</p>}
    </div>
  );
}

function PartoCard({ p }: { p: Parto }) {
  return (
    <div className="rounded-[14px] border border-line bg-surface p-4 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <p className="text-[13px] text-ink-2">{new Date(p.data_parto).toLocaleDateString("pt-BR")}</p>
        <span className="text-[12px] font-mono text-ink-3 bg-beige px-2 py-0.5 rounded-[6px]">
          {TIPO_PARTO_LABELS[p.tipo_parto] ?? p.tipo_parto}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[13px]">
        <div><span className="text-ink-4">Crias:</span> <strong className="text-ink">{p.num_crias}</strong></div>
        <div><span className="text-ink-4">Vivas:</span> <strong className="text-ink">{p.num_crias_vivas}</strong></div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Badge variant={p.houve_distorcia ? "danger" : "ok"}>
          Distócia: {p.houve_distorcia ? "Sim" : "Não"}
        </Badge>
        <Badge variant={p.houve_obito_matriz ? "danger" : "ok"}>
          Óbito Matriz: {p.houve_obito_matriz ? "Sim" : "Não"}
        </Badge>
      </div>
    </div>
  );
}

function SanitarioCard({ s }: { s: EventoSanitario }) {
  return (
    <div className="rounded-[14px] border border-line bg-surface p-4 flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <Badge variant="ghost">{SANITARIO_TIPO_LABELS[s.tipo] ?? s.tipo}</Badge>
        <p className="text-[12px] text-ink-3">{new Date(s.data_aplicacao).toLocaleDateString("pt-BR")}</p>
      </div>
      <p className="text-[15px] font-semibold text-ink">{s.produto}</p>
      {s.via && <p className="text-[12px] text-ink-3">Via: {s.via}</p>}
      {s.proxima_dose && (
        <p className="text-[12px] text-ink-2">
          Próxima dose: {new Date(s.proxima_dose).toLocaleDateString("pt-BR")}
        </p>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────

interface DiarioContentProps {
  animalId: string;
}

export function DiarioContent({ animalId }: DiarioContentProps) {
  const [tab, setTab] = useState<Tab>("peso");
  const [modal06Open, setModal06Open] = useState(false);
  const [modal07Open, setModal07Open] = useState(false);
  const [modal08Open, setModal08Open] = useState(false);
  const [modal09Open, setModal09Open] = useState(false);
  const qc = useQueryClient();
  const chartTheme = useChartTheme();

  const { data: pesagensData, isLoading: pesLoading } = useQuery({
    queryKey: ["pesagens", animalId],
    queryFn: () => diarioApi.pesagens(animalId),
    enabled: tab === "peso",
  });

  const { data: partosData, isLoading: parLoading } = useQuery({
    queryKey: ["partos", animalId],
    queryFn: () => diarioApi.partos(animalId),
    enabled: tab === "paricao",
  });

  const { data: sanitarioData, isLoading: sanLoading } = useQuery({
    queryKey: ["sanitario", animalId],
    queryFn: () => diarioApi.sanitario(animalId),
    enabled: tab === "sanitario",
  });

  const { data: ocorrenciasData, isLoading: ocoLoading } = useQuery({
    queryKey: ["ocorrencias", animalId],
    queryFn: () => diarioApi.ocorrencias(animalId),
    enabled: tab === "ocorrencias",
  });

  const invalidateCurrent = () => {
    const key =
      tab === "peso"
        ? "pesagens"
        : tab === "paricao"
        ? "partos"
        : tab === "sanitario"
        ? "sanitario"
        : "ocorrencias";
    void qc.invalidateQueries({ queryKey: [key, animalId] });
  };

  const pesagens = pesagensData?.data ?? [];
  const partos = partosData?.data ?? [];
  const sanitario = sanitarioData?.data ?? [];
  const ocorrencias = ocorrenciasData?.data ?? [];

  const tabs: { id: Tab; label: string; count?: number | undefined }[] = [
    { id: "peso", label: "Peso" },
    { id: "paricao", label: "Parição", count: partos.length || undefined },
    { id: "sanitario", label: "Sanitário", count: sanitario.length || undefined },
    {
      id: "ocorrencias",
      label: "Ocorrências",
      count: ocorrencias.filter((o) => !o.resolvida).length || undefined,
    },
  ];

  const chartData = pesagens.map((p) => ({
    data: new Date(p.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
    peso: p.peso_kg,
  }));

  return (
    <>
      {/* Tabs */}
      <div className="flex border-b border-line overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch]">
        {tabs.map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={[
              "px-5 py-3 text-[14px] font-medium border-b-2 transition-colors flex-shrink-0 whitespace-nowrap",
              tab === id
                ? "border-green-700 text-green-700"
                : "border-transparent text-ink-3 hover:text-ink",
            ].join(" ")}
          >
            {label}
            {count !== undefined && (
              <span className="ml-1.5 text-[11px] bg-green-700 text-white font-semibold px-1.5 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Peso */}
      {tab === "peso" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-ink-3">
              {pesagensData?.resumo && (
                <>
                  <span>
                    Última:{" "}
                    <strong className="text-ink">
                      {pesagensData.resumo.ultima_pesagem_kg ?? "—"} kg
                    </strong>
                  </span>
                  <span>
                    GMD:{" "}
                    <strong className="text-ink">
                      {pesagensData.resumo.gmd_periodo !== undefined
                        ? `${pesagensData.resumo.gmd_periodo} kg/dia`
                        : "—"}
                    </strong>
                  </span>
                  <span>
                    Registros:{" "}
                    <strong className="text-ink">{pesagensData.resumo.total_registros}</strong>
                  </span>
                </>
              )}
            </div>
            <Button variant="primary" size="sm" onClick={() => setModal06Open(true)}>
              + Registrar Pesagem
            </Button>
          </div>

          {pesLoading ? (
            <div className="h-48 animate-pulse bg-beige rounded-[12px]" />
          ) : chartData.length > 0 ? (
            <Card padding="sm">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="pesoGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartTheme.primaryColor} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={chartTheme.primaryColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                  <XAxis dataKey="data" tick={{ fontSize: 11, fill: chartTheme.textColor }} />
                  <YAxis tick={{ fontSize: 11, fill: chartTheme.textColor }} unit=" kg" />
                  <Tooltip
                    contentStyle={{
                      background: chartTheme.tooltipBg,
                      border: "1px solid #e6e3dc",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v) => [`${String(v)} kg`, "Peso"] as [string, string]}
                  />
                  <Area
                    type="monotone"
                    dataKey="peso"
                    stroke={chartTheme.primaryColor}
                    strokeWidth={2}
                    fill="url(#pesoGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          ) : null}

          {pesagens.length > 0 ? (
            <>
              {/* Mobile: cards */}
              <div className="flex flex-col gap-3 md:hidden">
                {pesagens.map((p) => <PesagemCard key={p.id} p={p} />)}
              </div>

              {/* Desktop: table */}
              <div className="hidden md:block overflow-hidden rounded-[14px] border border-line bg-surface">
                <table className="w-full">
                  <thead>
                    <tr className="bg-beige border-b border-line">
                      {["Data", "Peso (kg)", "Estágio", "GMD", "Observação"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-[11px] font-semibold text-ink-2 uppercase tracking-[0.04em]"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pesagens.map((p) => (
                      <tr key={p.id} className="border-b border-line last:border-0 hover:bg-beige/50 transition-colors">
                        <td className="px-4 py-2.5 text-[13px] text-ink">
                          {new Date(p.data).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-2.5 text-[14px] font-semibold text-ink">{p.peso_kg}</td>
                        <td className="px-4 py-2.5 text-[12px] text-ink-3">
                          {ESTAGIO_LABELS[p.estagio] ?? p.estagio}
                        </td>
                        <td className="px-4 py-2.5 text-[13px] text-ink-2">
                          {p.gmd_calculado !== undefined ? `${p.gmd_calculado} kg/dia` : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-[12px] text-ink-3">{p.observacao ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            !pesLoading && (
              <p className="text-center text-[14px] text-ink-3 py-8">Nenhuma pesagem registrada.</p>
            )
          )}
        </div>
      )}

      {/* Tab: Parição */}
      {tab === "paricao" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            {partos.length > 0 && (
              <p className="text-[13px] text-ink-3">
                IEP médio: <strong className="text-ink">—</strong> · {partos.length} parto(s) registrado(s)
              </p>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={() => setModal07Open(true)}
              className="ml-auto"
            >
              + Registrar Parto
            </Button>
          </div>

          {parLoading ? (
            <div className="h-32 animate-pulse bg-beige rounded-[12px]" />
          ) : partos.length > 0 ? (
            <>
              {/* Mobile: cards */}
              <div className="flex flex-col gap-3 md:hidden">
                {partos.map((p) => <PartoCard key={p.id} p={p} />)}
              </div>

              {/* Desktop: table */}
              <div className="hidden md:block overflow-hidden rounded-[14px] border border-line bg-surface">
                <table className="w-full">
                  <thead>
                    <tr className="bg-beige border-b border-line">
                      {["Data do Parto", "Tipo", "Crías", "Crías Vivas", "Distócia", "Óbito Matriz"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left text-[11px] font-semibold text-ink-2 uppercase tracking-[0.04em]"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {partos.map((p) => (
                      <tr key={p.id} className="border-b border-line last:border-0 hover:bg-beige/50 transition-colors">
                        <td className="px-4 py-2.5 text-[13px] text-ink">
                          {new Date(p.data_parto).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-2.5 text-[12px] text-ink-2">
                          {TIPO_PARTO_LABELS[p.tipo_parto] ?? p.tipo_parto}
                        </td>
                        <td className="px-4 py-2.5 text-[13px] text-ink">{p.num_crias}</td>
                        <td className="px-4 py-2.5 text-[13px] text-ink">{p.num_crias_vivas}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant={p.houve_distorcia ? "danger" : "ok"}>
                            {p.houve_distorcia ? "Sim" : "Não"}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge variant={p.houve_obito_matriz ? "danger" : "ok"}>
                            {p.houve_obito_matriz ? "Sim" : "Não"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-center text-[14px] text-ink-3 py-8">Nenhum parto registrado.</p>
          )}
        </div>
      )}

      {/* Tab: Sanitário */}
      {tab === "sanitario" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setModal08Open(true)}>
              + Registrar Evento Sanitário
            </Button>
          </div>

          {sanLoading ? (
            <div className="h-32 animate-pulse bg-beige rounded-[12px]" />
          ) : sanitario.length > 0 ? (
            <>
              {/* Mobile: cards */}
              <div className="flex flex-col gap-3 md:hidden">
                {sanitario.map((s) => <SanitarioCard key={s.id} s={s} />)}
              </div>

              {/* Desktop: table */}
              <div className="hidden md:block overflow-hidden rounded-[14px] border border-line bg-surface">
                <table className="w-full">
                  <thead>
                    <tr className="bg-beige border-b border-line">
                      {["Tipo", "Produto", "Data", "Via", "Próxima Dose"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-[11px] font-semibold text-ink-2 uppercase tracking-[0.04em]"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sanitario.map((s) => (
                      <tr key={s.id} className="border-b border-line last:border-0 hover:bg-beige/50 transition-colors">
                        <td className="px-4 py-2.5">
                          <Badge variant="ghost">{SANITARIO_TIPO_LABELS[s.tipo] ?? s.tipo}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-[13px] font-medium text-ink">{s.produto}</td>
                        <td className="px-4 py-2.5 text-[13px] text-ink-2">
                          {new Date(s.data_aplicacao).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-2.5 text-[12px] text-ink-3">{s.via ?? "—"}</td>
                        <td className="px-4 py-2.5 text-[12px] text-ink-2">
                          {s.proxima_dose
                            ? new Date(s.proxima_dose).toLocaleDateString("pt-BR")
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-center text-[14px] text-ink-3 py-8">
              Nenhum evento sanitário registrado.
            </p>
          )}
        </div>
      )}

      {/* Tab: Ocorrências — already card-based, no change needed */}
      {tab === "ocorrencias" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setModal09Open(true)}>
              + Registrar Ocorrência
            </Button>
          </div>
          {ocoLoading ? (
            <div className="h-32 animate-pulse bg-beige rounded-[12px]" />
          ) : ocorrencias.length > 0 ? (
            <div className="flex flex-col gap-2">
              {[...ocorrencias]
                .sort((a, b) => (a.resolvida === b.resolvida ? 0 : a.resolvida ? 1 : -1))
                .map((o) => (
                  <Card key={o.id} padding="sm" className={o.resolvida ? "opacity-70" : ""}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-mono text-ink-4 bg-beige px-2 py-0.5 rounded-[6px]">
                            {CATEGORIA_LABELS[o.categoria] ?? o.categoria}
                          </span>
                          <Badge variant={o.resolvida ? "ok" : "warn"}>
                            {o.resolvida ? "Resolvida" : "Em aberto"}
                          </Badge>
                        </div>
                        <p className="text-[14px] font-semibold text-ink mt-1">{o.titulo}</p>
                        <p className="text-[13px] text-ink-3 mt-0.5">{o.descricao}</p>
                        <p className="text-[11px] text-ink-4 mt-1">
                          {new Date(o.data).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          ) : (
            <p className="text-center text-[14px] text-ink-3 py-8">Nenhuma ocorrência registrada.</p>
          )}
        </div>
      )}

      <Modal06Pesagem
        open={modal06Open}
        onClose={() => setModal06Open(false)}
        animalId={animalId}
        onSuccess={invalidateCurrent}
      />
      <Modal07Parto
        open={modal07Open}
        onClose={() => setModal07Open(false)}
        animalId={animalId}
        onSuccess={invalidateCurrent}
      />
      <Modal08Sanitario
        open={modal08Open}
        onClose={() => setModal08Open(false)}
        animalId={animalId}
        onSuccess={invalidateCurrent}
      />
      <Modal09Ocorrencia
        open={modal09Open}
        onClose={() => setModal09Open(false)}
        animalId={animalId}
        onSuccess={invalidateCurrent}
      />
    </>
  );
}

export function DiarioListPage() {
  const [search, setSearch] = useState("");
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const { data: animaisData } = useQuery({
    queryKey: ["animais-diario-search", debouncedSearch],
    queryFn: () => animaisApi.listar({ q: debouncedSearch, limit: 8 }),
    enabled: debouncedSearch.length > 1 && !selectedAnimal,
  });

  const sugestoes = animaisData?.data ?? [];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4">
      <div>
        <h1
          className="text-[22px] font-bold text-ink"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Diário de Bordo
        </h1>
        <p className="text-[14px] text-ink-3 mt-0.5">Registros individuais por animal</p>
      </div>

      {/* Animal search */}
      {!selectedAnimal ? (
        <div className="max-w-lg">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar animal por nome ou código…"
              className="w-full pl-9 pr-4 py-2.5 rounded-[10px] border border-line text-[14px] text-ink bg-surface outline-none focus:border-green-700 focus:ring-[3px] focus:ring-green-700/18 transition-all placeholder:text-ink-4"
            />
          </div>
          {sugestoes.length > 0 && search && (
            <div className="mt-1 border border-line rounded-[10px] bg-surface overflow-hidden shadow-[var(--shadow-sm)]">
              {sugestoes.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-beige transition-colors border-b border-line last:border-0"
                  onClick={() => {
                    setSelectedAnimal(a);
                    setSearch("");
                  }}
                >
                  <strong className="text-ink">{a.nome}</strong>{" "}
                  <span className="font-mono text-ink-4">{a.codigo}</span>{" "}
                  <span className="text-ink-3 ml-1">
                    {a.especie} · {a.status}
                  </span>
                </button>
              ))}
            </div>
          )}
          {search.length > 1 && sugestoes.length === 0 && (
            <p className="text-[13px] text-ink-4 mt-2 px-1">
              Nenhum animal encontrado para "{search}".
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Animal card */}
          <Card padding="sm" className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-white font-bold text-[15px]">
              {selectedAnimal.nome.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[16px] font-bold text-ink truncate">{selectedAnimal.nome}</p>
              <p className="text-[12px] text-ink-3 font-mono truncate">
                {selectedAnimal.codigo} · {selectedAnimal.especie} · {selectedAnimal.raca_principal}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setSelectedAnimal(null)}>
              Trocar animal
            </Button>
          </Card>

          <DiarioContent animalId={selectedAnimal.id} />
        </>
      )}
    </div>
  );
}
