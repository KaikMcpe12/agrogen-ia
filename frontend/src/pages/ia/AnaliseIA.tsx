import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Brain, TrendingUp, Dna, AlertTriangle, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { iaApi } from "@/lib/api/endpoints/ia";
import { animaisApi } from "@/lib/api/endpoints/animais";
import { useDebounce } from "@/hooks/useDebounce";
import { useChartTheme } from "@/hooks/useChartTheme";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import type { Animal, PredicaoPrenhez } from "@/types";

type Tab = "predicao" | "padroes" | "selecao";

/* ── Gauge SVG ── */
function GaugeSVG({ pct }: { pct: number }) {
  const r = 70;
  const cx = 100, cy = 100;
  const start = Math.PI * 0.75;
  const end = Math.PI * 2.25;
  const total = end - start;
  const filled = total * (pct / 100);
  const toXY = (angle: number) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  });

  const s = toXY(start);
  const eF = toXY(start + filled);
  const eE = toXY(end);
  const color = pct >= 70 ? "#15803d" : pct >= 45 ? "#b45309" : "#b91c1c";

  return (
    <svg viewBox="0 0 200 160" className="w-48 h-36">
      <path
        d={`M ${s.x} ${s.y} A ${r} ${r} 0 ${total > Math.PI ? 1 : 0} 1 ${eE.x} ${eE.y}`}
        fill="none" stroke="#e6e3dc" strokeWidth="14" strokeLinecap="round"
      />
      <path
        d={`M ${s.x} ${s.y} A ${r} ${r} 0 ${filled > Math.PI ? 1 : 0} 1 ${eF.x} ${eF.y}`}
        fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
      />
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize="28" fontWeight="700" fill={color}>
        {pct}%
      </text>
      <text x={cx} y={cy + 26} textAnchor="middle" fontSize="11" fill="#6b6b6b">
        prenhez estimada
      </text>
    </svg>
  );
}

/* ── Aba: Predição ── */
function TabPredicao() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [predicao, setPredicao] = useState<PredicaoPrenhez | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const chartTheme = useChartTheme();

  const { data: animaisData } = useQuery({
    queryKey: ["animais-ia-search", debouncedSearch],
    queryFn: () => animaisApi.listar({ q: debouncedSearch, sexo: "FEMEA", status: "ATIVA", limit: 8 }),
    enabled: debouncedSearch.length > 1 && !selectedAnimal,
  });

  const rodar = useMutation({
    mutationFn: () => iaApi.predicao({ animal_id: selectedAnimal!.id }),
    onSuccess: (data) => {
      setPredicao(data.data);
      void qc.invalidateQueries({ queryKey: ["alertas"] });
    },
  });

  const sugestoes = animaisData?.data ?? [];

  const fatoresChart = (predicao?.fatores_determinantes ?? []).map((f) => ({
    label: f.label,
    impacto: Math.round(Math.abs(f.impacto) * 100),
    sentido: f.sentido,
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Animal picker */}
      {!selectedAnimal ? (
        <div className="max-w-md">
          <p className="text-[13px] text-ink-3 mb-2">Selecione uma fêmea para análise preditiva:</p>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou código…"
            className="w-full px-3 py-2.5 rounded-[10px] border border-line text-[14px] text-ink bg-surface outline-none focus:border-green-700 focus:ring-[3px] focus:ring-green-700/18 transition-all placeholder:text-ink-4"
          />
          {sugestoes.length > 0 && (
            <div className="mt-1 border border-line rounded-[10px] bg-surface overflow-hidden shadow-[var(--shadow-sm)]">
              {sugestoes.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-beige transition-colors border-b border-line last:border-0"
                  onClick={() => { setSelectedAnimal(a); setSearch(""); }}
                >
                  <strong>{a.nome}</strong> <span className="font-mono text-ink-4">{a.codigo}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Context card */}
          <Card padding="sm" className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-900 font-bold">
              {selectedAnimal.nome.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-bold text-ink">{selectedAnimal.nome}</p>
              <p className="text-[12px] text-ink-3 font-mono">{selectedAnimal.codigo} · CC atual: {selectedAnimal.condicao_corporal} · {selectedAnimal.num_partos} partos</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setSelectedAnimal(null); setPredicao(null); }}>
                Trocar
              </Button>
              {!predicao && (
                <Button variant="primary" size="sm" onClick={() => rodar.mutate()} loading={rodar.isPending}>
                  <Brain size={15} /> Rodar Predição
                </Button>
              )}
            </div>
          </Card>

          {rodar.isPending && (
            <div className="text-center py-10">
              <div className="w-8 h-8 border-2 border-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-[14px] text-ink-3">Processando modelo de IA…</p>
            </div>
          )}

          {predicao && (
            <div className="flex flex-col gap-5">
              {/* Gauge + recomendações */}
              <div className="flex flex-col md:flex-row gap-5">
                <Card padding="sm" className="flex flex-col items-center justify-center gap-2">
                  <GaugeSVG pct={predicao.score_percentual} />
                  <Badge variant={predicao.classificacao === "FAVORAVEL" ? "ok" : "danger"}>
                    {predicao.classificacao === "FAVORAVEL" ? "Favorável" : "Desfavorável"}
                  </Badge>
                  <p className="text-[11px] text-ink-4 font-mono">{predicao.modelo_versao} · {predicao.processado_em_ms}ms</p>
                </Card>

                <Card padding="sm" className="flex-1 flex flex-col gap-3">
                  <p className="text-[13px] font-semibold text-ink-2">Recomendações</p>
                  {predicao.recomendacoes.map((r, i) => (
                    <div key={i} className="flex gap-2">
                      <CheckCircle size={14} className="text-ok shrink-0 mt-0.5" />
                      <p className="text-[13px] text-ink">{r}</p>
                    </div>
                  ))}
                  {predicao.aviso_clinico && (
                    <div className="flex gap-2 p-2.5 rounded-[8px] bg-warn-bg border border-warn/20">
                      <AlertTriangle size={14} className="text-warn shrink-0 mt-0.5" />
                      <p className="text-[12px] text-warn">{predicao.aviso_clinico}</p>
                    </div>
                  )}
                </Card>
              </div>

              {/* Fatores */}
              {fatoresChart.length > 0 && (
                <Card padding="sm">
                  <p className="text-[13px] font-semibold text-ink-2 mb-3">Top fatores determinantes</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={fatoresChart} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 130 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: chartTheme.textColor }} unit="%" />
                      <YAxis dataKey="label" type="category" tick={{ fontSize: 11, fill: chartTheme.textColor }} width={120} />
                      <Tooltip
                        contentStyle={{ background: chartTheme.tooltipBg, border: "1px solid #e6e3dc", borderRadius: 8, fontSize: 12 }}
                        formatter={(v) => [`${String(v)}%`, "Impacto"] as [string, string]}
                      />
                      <Bar dataKey="impacto" radius={[0, 4, 4, 0]}>
                        {fatoresChart.map((f, i) => (
                          <Cell key={i} fill={f.sentido === "POSITIVO" ? chartTheme.successColor : chartTheme.dangerColor} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              <div className="flex justify-end">
                <Button variant="primary" size="sm" onClick={() => setPredicao(null)}>
                  Nova Análise
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Aba: Padrões de Fertilidade ── */
function TabPadroes() {
  const chartTheme = useChartTheme();

  const { data, isLoading } = useQuery({
    queryKey: ["padroes-fertilidade"],
    queryFn: () => iaApi.padroes(),
  });

  const padroes = data?.data;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-56 animate-pulse bg-beige rounded-[14px]" />)}
      </div>
    );
  }

  if (!padroes) return null;

  if (!padroes.minimo_inseminacoes_atingido) {
    return (
      <div className="flex flex-col items-center py-16 gap-3">
        <AlertTriangle size={32} className="text-warn" />
        <p className="text-[15px] font-semibold text-ink">Dados insuficientes</p>
        <p className="text-[14px] text-ink-3">São necessárias ao menos 20 inseminações para análise de padrões.</p>
      </div>
    );
  }

  const barProps = {
    contentStyle: { background: chartTheme.tooltipBg, border: "1px solid #e6e3dc", borderRadius: 8, fontSize: 12 },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card padding="sm">
        <p className="text-[13px] font-semibold text-ink-2 mb-3">Taxa de prenhez por mês</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={padroes.por_mes}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
            <XAxis dataKey="mes" tick={{ fontSize: 10, fill: chartTheme.textColor }} />
            <YAxis tick={{ fontSize: 10, fill: chartTheme.textColor }} unit="%" />
            <Tooltip {...barProps} formatter={(v) => [`${String(v)}%`, "Taxa"] as [string, string]} />
            <Bar dataKey="taxa" fill={chartTheme.primaryColor} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card padding="sm">
        <p className="text-[13px] font-semibold text-ink-2 mb-3">Taxa por raça</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={padroes.por_raca} layout="vertical" margin={{ left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: chartTheme.textColor }} unit="%" />
            <YAxis dataKey="raca" type="category" tick={{ fontSize: 10, fill: chartTheme.textColor }} width={55} />
            <Tooltip {...barProps} formatter={(v) => [`${String(v)}%`, "Taxa"] as [string, string]} />
            <Bar dataKey="taxa" fill={chartTheme.secondaryColor} radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card padding="sm">
        <p className="text-[13px] font-semibold text-ink-2 mb-3">Taxa por técnico</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={padroes.por_tecnico} layout="vertical" margin={{ left: 90 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: chartTheme.textColor }} unit="%" />
            <YAxis dataKey="tecnico_nome" type="category" tick={{ fontSize: 10, fill: chartTheme.textColor }} width={85} />
            <Tooltip {...barProps} formatter={(v) => [`${String(v)}%`, "Taxa"] as [string, string]} />
            <Bar dataKey="taxa" fill={chartTheme.successColor} radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card padding="sm">
        <p className="text-[13px] font-semibold text-ink-2 mb-3">Taxa por protocolo</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={padroes.por_protocolo} layout="vertical" margin={{ left: 110 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: chartTheme.textColor }} unit="%" />
            <YAxis dataKey="protocolo" type="category" tick={{ fontSize: 10, fill: chartTheme.textColor }} width={105} />
            <Tooltip {...barProps} formatter={(v) => [`${String(v)}%`, "Taxa"] as [string, string]} />
            <Bar dataKey="taxa" fill={chartTheme.warnColor} radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

/* ── Aba: Seleção Genética ── */
const CRITERIOS = [
  { id: "fertilidade", label: "Fertilidade (DEP)" },
  { id: "peso_desmame", label: "Peso ao desmame" },
  { id: "heterose", label: "Heterose estimada" },
  { id: "endogamia", label: "Risco de endogamia" },
];

function TabSelecao() {
  const [criteriosSelecionados, setCriterios] = useState<string[]>(["fertilidade"]);
  const [resultado, setResultado] = useState<{ recomendacoes: unknown[] } | null>(null);

  const rodar = useMutation({
    mutationFn: () => iaApi.selecaoGenetica({ criterios: criteriosSelecionados }),
    onSuccess: (data) => setResultado(data.data),
  });

  const toggleCriterio = (id: string) => {
    setCriterios((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <Card padding="sm">
        <p className="text-[13px] font-semibold text-ink-2 mb-3">Critérios de seleção</p>
        <div className="grid grid-cols-2 gap-2">
          {CRITERIOS.map((c) => (
            <label
              key={c.id}
              className={[
                "flex items-center gap-2 px-3 py-2.5 rounded-[10px] border cursor-pointer transition-colors text-[13px]",
                criteriosSelecionados.includes(c.id)
                  ? "border-green-700 bg-green-100/50 text-green-900 font-medium"
                  : "border-line bg-surface text-ink-2 hover:bg-beige",
              ].join(" ")}
            >
              <input
                type="checkbox"
                className="accent-green-700"
                checked={criteriosSelecionados.includes(c.id)}
                onChange={() => toggleCriterio(c.id)}
              />
              {c.label}
            </label>
          ))}
        </div>
        <div className="mt-4">
          <Button
            variant="primary"
            size="sm"
            onClick={() => rodar.mutate()}
            loading={rodar.isPending}
            disabled={criteriosSelecionados.length === 0}
          >
            <Dna size={15} /> Gerar Recomendações
          </Button>
        </div>
      </Card>

      {resultado && (
        <Card padding="sm">
          <p className="text-[13px] font-semibold text-ink-2 mb-3">Pares recomendados</p>
          <div className="overflow-hidden rounded-[10px] border border-line">
            <table className="w-full">
              <thead>
                <tr className="bg-beige border-b border-line">
                  {["Matriz", "Reprodutor", "Score Genético", "Heterose", "Risco Endogamia"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-ink-2 uppercase tracking-[0.04em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(resultado.recomendacoes as { matriz: string; reprodutor: string; score_genetico: number; heterose_esperada: string; risco_endogamia: string }[]).map((r, i) => (
                  <tr key={i} className="border-b border-line last:border-0 hover:bg-beige/50 transition-colors">
                    <td className="px-3 py-2.5 text-[13px] font-medium text-ink">{r.matriz}</td>
                    <td className="px-3 py-2.5 text-[13px] text-ink-2">{r.reprodutor}</td>
                    <td className="px-3 py-2.5">
                      <span className="text-[13px] font-semibold text-green-700">{r.score_genetico}</span>
                    </td>
                    <td className="px-3 py-2.5 text-[13px] text-ink-3">{r.heterose_esperada}</td>
                    <td className="px-3 py-2.5 text-[13px] text-ink-3">{r.risco_endogamia}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ── Main Page ── */
export function AnaliseIAPage() {
  const [tab, setTab] = useState<Tab>("predicao");

  const tabs: { id: Tab; label: string; icon: typeof Brain }[] = [
    { id: "predicao", label: "Predição de Prenhez", icon: Brain },
    { id: "padroes", label: "Padrões de Fertilidade", icon: TrendingUp },
    { id: "selecao", label: "Seleção Genética", icon: Dna },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6 flex flex-col gap-4">
      <div>
        <h1 className="text-[22px] font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
          Análise IA
        </h1>
        <p className="text-[14px] text-ink-3 mt-0.5">Predição, padrões reprodutivos e seleção genética</p>
      </div>

      <div className="flex border-b border-line">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={[
              "flex items-center gap-2 px-5 py-3 text-[14px] font-medium border-b-2 transition-colors",
              tab === id
                ? "border-green-700 text-green-700"
                : "border-transparent text-ink-3 hover:text-ink",
            ].join(" ")}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === "predicao" && <TabPredicao />}
      {tab === "padroes" && <TabPadroes />}
      {tab === "selecao" && <TabSelecao />}
    </div>
  );
}
