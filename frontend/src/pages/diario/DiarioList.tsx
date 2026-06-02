import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Search, Scale, Baby, ShieldPlus, AlertCircle, FileText, Download, Clock } from "lucide-react";
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
import { STORAGE_KEYS } from "@/lib/storage-keys";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Animal, Pesagem, Parto, EventoSanitario, Sexo } from "@/types";

function getLastAnimaisIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.lastAnimaisIds) ?? "[]") as string[];
  } catch { return []; }
}

function saveLastAnimalId(id: string) {
  const ids = getLastAnimaisIds().filter((x) => x !== id);
  localStorage.setItem(STORAGE_KEYS.lastAnimaisIds, JSON.stringify([id, ...ids].slice(0, 5)));
}

function isProximaDoseAlerta(proxima_dose?: string): boolean {
  if (!proxima_dose) return false;
  const diff = Math.ceil((new Date(proxima_dose).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff <= 7;
}

function isProximaDoseVencida(proxima_dose?: string): boolean {
  if (!proxima_dose) return false;
  return new Date(proxima_dose).getTime() < Date.now();
}

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
  sexo?: Sexo;
}

export function DiarioContent({ animalId, sexo }: DiarioContentProps) {
  const [tab, setTab] = useState<Tab>("peso");
  const [modal06Open, setModal06Open] = useState(false);
  const [modal07Open, setModal07Open] = useState(false);
  const [modal08Open, setModal08Open] = useState(false);
  const [modal09Open, setModal09Open] = useState(false);
  const qc = useQueryClient();
  const chartTheme = useChartTheme();

  const { data: pesagensData, isLoading: pesLoading } = useQuery({
    queryKey: ["diario", animalId, "pesagens"],
    queryFn: ({ signal }) => diarioApi.pesagens(animalId, signal),
    enabled: tab === "peso",
  });

  const { data: partosData, isLoading: parLoading } = useQuery({
    queryKey: ["diario", animalId, "partos"],
    queryFn: ({ signal }) => diarioApi.partos(animalId, signal),
    enabled: tab === "paricao",
  });

  const { data: sanitarioData, isLoading: sanLoading } = useQuery({
    queryKey: ["diario", animalId, "sanitario"],
    queryFn: ({ signal }) => diarioApi.sanitario(animalId, signal),
    staleTime: 5 * 60 * 1000,
  });

  const { data: ocorrenciasData, isLoading: ocoLoading } = useQuery({
    queryKey: ["diario", animalId, "ocorrencias"],
    queryFn: ({ signal }) => diarioApi.ocorrencias(animalId, signal),
    enabled: tab === "ocorrencias",
  });

  const invalidateCurrent = () => {
    const subKey =
      tab === "peso"
        ? "pesagens"
        : tab === "paricao"
        ? "partos"
        : tab === "sanitario"
        ? "sanitario"
        : "ocorrencias";
    void qc.invalidateQueries({ queryKey: ["diario", animalId, subKey] });
  };

  const pesagens = pesagensData?.data ?? [];
  const partos = partosData?.data ?? [];
  const sanitario = sanitarioData?.data ?? [];
  const ocorrencias = ocorrenciasData?.data ?? [];

  const sanitarioAlerta = sanitario.some((s) => isProximaDoseAlerta(s.proxima_dose));

  const naoResolvidasCount = ocorrencias.filter((o) => !o.resolvida).length;
  const allTabs: { id: Tab; label: string; count?: number; alerta?: boolean; hidden?: boolean }[] = [
    { id: "peso", label: "Peso" },
    { id: "paricao", label: "Parição", hidden: sexo === "MACHO" },
    { id: "sanitario", label: "Sanitário", alerta: sanitarioAlerta },
    { id: "ocorrencias", label: "Ocorrências", ...(naoResolvidasCount > 0 ? { count: naoResolvidasCount } : {}) },
  ];
  const tabs = allTabs.filter((t) => !t.hidden);

  const chartData = pesagens.map((p) => ({
    dataFormatada: new Date(p.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }),
    dataCompleta: new Date(p.data).toLocaleDateString("pt-BR"),
    peso: p.peso_kg,
    gmd: p.gmd_calculado,
  }));

  return (
    <>
      {/* Tabs */}
      <div className="flex border-b border-line overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch]">
        {tabs.map(({ id, label, count, alerta }) => (
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
            {alerta && (
              <span className="ml-1.5 inline-flex items-center justify-center w-[18px] h-[18px] bg-warn text-white rounded-full" title="Dose próxima ou vencida">
                <AlertCircle size={11} />
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
                  <XAxis dataKey="dataFormatada" tick={{ fontSize: 11, fill: chartTheme.textColor }} />
                  <YAxis tick={{ fontSize: 11, fill: chartTheme.textColor }} unit=" kg" />
                  <Tooltip
                    contentStyle={{ background: chartTheme.tooltipBg, border: `1px solid ${chartTheme.gridColor}`, borderRadius: 8, fontSize: 12 }}
                    labelFormatter={(label) => `Data: ${String(label)}`}
                    formatter={(v: unknown, name: string | number | undefined) => {
                      if (name === "peso") return [`${String(v)} kg`, "Peso"];
                      return [`${String(v)} kg/dia`, "GMD"];
                    }}
                  />
                  <Area type="monotone" dataKey="peso" name="peso" stroke={chartTheme.primaryColor} strokeWidth={2} fill="url(#pesoGrad)" dot={{ r: 3 }} />
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
                        <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-ink-2 uppercase tracking-[0.04em]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pesagens.map((p) => (
                      <tr key={p.id} className="border-b border-line last:border-0 hover:bg-beige/50 transition-colors">
                        <td className="px-4 py-2.5 text-[13px] text-ink">{new Date(p.data).toLocaleDateString("pt-BR")}</td>
                        <td className="px-4 py-2.5 text-[14px] font-semibold text-ink">{p.peso_kg}</td>
                        <td className="px-4 py-2.5 text-[12px] text-ink-3">{ESTAGIO_LABELS[p.estagio] ?? p.estagio}</td>
                        <td className="px-4 py-2.5 text-[13px] text-ink-2">{p.gmd_calculado !== undefined ? `${p.gmd_calculado} kg/dia` : "—"}</td>
                        <td className="px-4 py-2.5 text-[12px] text-ink-3">{p.observacao ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            !pesLoading && (
              <div className="flex flex-col items-center py-12 gap-3 text-center">
                <Scale size={32} className="text-ink-4" />
                <p className="text-[15px] font-semibold text-ink">Sem pesagens registradas</p>
                <p className="text-[13px] text-ink-3">Registre a primeira pesagem para acompanhar a curva de crescimento.</p>
              </div>
            )
          )}
        </div>
      )}

      {/* Tab: Parição */}
      {tab === "paricao" && (
        <div className="flex flex-col gap-4">
          {sexo === "MACHO" ? (
            <div className="flex flex-col items-center py-12 gap-3 text-center">
              <Baby size={32} className="text-ink-4" />
              <p className="text-[15px] font-semibold text-ink">Aba não disponível</p>
              <p className="text-[13px] text-ink-3 max-w-xs">Registros de parição são exclusivos para animais do sexo feminino.</p>
            </div>
          ) : (
          <>
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
            <div className="flex flex-col items-center py-12 gap-3 text-center">
              <Baby size={32} className="text-ink-4" />
              <p className="text-[15px] font-semibold text-ink">Sem partos registrados</p>
              <p className="text-[13px] text-ink-3">Registre o primeiro parto para iniciar o histórico reprodutivo.</p>
            </div>
          )}
          </>
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
                        <td className="px-4 py-2.5 text-[12px]">
                          {s.proxima_dose ? (
                            <span className={`flex items-center gap-1 ${isProximaDoseVencida(s.proxima_dose) ? "text-danger font-medium" : isProximaDoseAlerta(s.proxima_dose) ? "text-warn font-medium" : "text-ink-2"}`}>
                              {(isProximaDoseVencida(s.proxima_dose) || isProximaDoseAlerta(s.proxima_dose)) && <Clock size={12} />}
                              {new Date(s.proxima_dose).toLocaleDateString("pt-BR")}
                            </span>
                          ) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            !sanLoading && (
              <div className="flex flex-col items-center py-12 gap-3 text-center">
                <ShieldPlus size={32} className="text-ink-4" />
                <p className="text-[15px] font-semibold text-ink">Sem eventos sanitários</p>
                <p className="text-[13px] text-ink-3">Registre vacinas, vermifugações e medicações.</p>
              </div>
            )
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
            !ocoLoading && (
              <div className="flex flex-col items-center py-12 gap-3 text-center">
                <AlertCircle size={32} className="text-ink-4" />
                <p className="text-[15px] font-semibold text-ink">Sem ocorrências registradas</p>
                <p className="text-[13px] text-ink-3">Registre eventos como lesões, comportamentos incomuns ou intercorrências.</p>
              </div>
            )
          )}
        </div>
      )}

      {/* Rodapé: exportar */}
      <div className="flex items-center gap-3 pt-4 border-t border-line mt-2">
        <p className="text-[12px] text-ink-4 mr-auto">Exportar dados deste animal:</p>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-line text-[13px] text-ink-3 hover:bg-beige transition-colors"
          onClick={() => alert("Exportação de PDF em desenvolvimento")}
          aria-label="Exportar ficha em PDF"
        >
          <FileText size={14} /> Ficha PDF
        </button>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-line text-[13px] text-ink-3 hover:bg-beige transition-colors"
          onClick={() => alert("Exportação de CSV em desenvolvimento")}
          aria-label="Exportar dados em CSV"
        >
          <Download size={14} /> Exportar CSV
        </button>
      </div>

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
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const lastIds = getLastAnimaisIds();

  const { data: animaisData } = useQuery({
    queryKey: ["animais", "list", { q: debouncedSearch, limit: 8 }],
    queryFn: ({ signal }) => animaisApi.listar({ q: debouncedSearch, limit: 8 }, signal),
    enabled: debouncedSearch.length > 1,
  });

  const { data: lastAnimaisData } = useQuery({
    queryKey: ["animais-last-visited", lastIds],
    queryFn: async () => {
      const results = await Promise.all(lastIds.map((id) => animaisApi.buscar(id)));
      return results.map((r) => r.data).filter(Boolean) as Animal[];
    },
    enabled: lastIds.length > 0 && !debouncedSearch,
    staleTime: 2 * 60 * 1000,
  });

  const sugestoes = animaisData?.data ?? [];
  const ultimosAcessados = lastAnimaisData ?? [];

  const handleSelectAnimal = (animal: Animal) => {
    saveLastAnimalId(animal.id);
    void navigate(`/diario-de-bordo/${animal.id}`);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4">
      <div>
        <h1 className="text-[22px] font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
          Diário de Bordo
        </h1>
        <p className="text-[14px] text-ink-3 mt-0.5">Registros individuais por animal</p>
      </div>

      {/* Animal search */}
      <div className="max-w-lg">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar animal por nome ou código…"
            className="w-full pl-9 pr-4 py-2.5 rounded-[10px] border border-line text-[14px] text-ink bg-surface outline-none focus:border-green-700 focus:ring-[3px] focus:ring-green-700/18 transition-all placeholder:text-ink-4"
          />
        </div>
        {sugestoes.length > 0 && debouncedSearch && (
          <div className="mt-1 border border-line rounded-[10px] bg-surface overflow-hidden shadow-[var(--shadow-sm)]">
            {sugestoes.map((a) => (
              <button
                key={a.id}
                type="button"
                className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-beige transition-colors border-b border-line last:border-0"
                onClick={() => handleSelectAnimal(a)}
              >
                <strong className="text-ink">{a.nome}</strong>{" "}
                <span className="font-mono text-ink-4">{a.codigo}</span>{" "}
                <span className="text-ink-3 ml-1">{a.especie} · {a.status}</span>
              </button>
            ))}
          </div>
        )}
        {debouncedSearch.length > 1 && sugestoes.length === 0 && (
          <p className="text-[13px] text-ink-4 mt-2 px-1">Nenhum animal encontrado para "{debouncedSearch}".</p>
        )}
      </div>

      {/* Atalhos: últimos 5 animais acessados */}
      {ultimosAcessados.length > 0 && !debouncedSearch && (
        <div>
          <p className="text-[12px] font-semibold text-ink-4 uppercase tracking-[0.06em] mb-2">Acessados recentemente</p>
          <div className="flex flex-wrap gap-2">
            {ultimosAcessados.map((a) => (
              <button
                key={a.id}
                onClick={() => handleSelectAnimal(a)}
                className="flex items-center gap-2 px-3 py-2 rounded-[10px] border border-line bg-surface hover:bg-beige transition-colors text-left"
              >
                <span className="text-[18px]">{a.especie === "BOVINO" ? "🐄" : a.especie === "OVINO" ? "🐑" : "🐐"}</span>
                <div>
                  <p className="text-[13px] font-semibold text-ink">{a.nome}</p>
                  <p className="text-[11px] font-mono text-ink-4">{a.codigo}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!debouncedSearch && ultimosAcessados.length === 0 && (
        <Card padding="md" className="max-w-lg text-center">
          <p className="text-[14px] text-ink-3">Busque um animal pelo nome ou código para abrir seu diário.</p>
        </Card>
      )}
    </div>
  );
}
