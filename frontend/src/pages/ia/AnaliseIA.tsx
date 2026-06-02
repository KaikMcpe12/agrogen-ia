import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Brain, TrendingUp, Dna, AlertTriangle, Syringe } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { iaApi } from "@/lib/api/endpoints/ia";
import { animaisApi } from "@/lib/api/endpoints/animais";
import { useDebounce } from "@/hooks/useDebounce";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useChartTheme } from "@/hooks/useChartTheme";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { Animal, PredicaoPrenhez } from "@/types";

type Tab = "predicao" | "padroes" | "selecao";

/* ── Gauge SVG ─────────────────────────────────────────────────── */
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
    <svg viewBox="0 0 200 160" className="w-52 h-40">
      <path
        d={`M ${s.x} ${s.y} A ${r} ${r} 0 ${total > Math.PI ? 1 : 0} 1 ${eE.x} ${eE.y}`}
        fill="none"
        stroke="#e6e3dc"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d={`M ${s.x} ${s.y} A ${r} ${r} 0 ${filled > Math.PI ? 1 : 0} 1 ${eF.x} ${eF.y}`}
        fill="none"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="round"
      />
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize="30" fontWeight="700" fill={color}>
        {pct}%
      </text>
      <text x={cx} y={cy + 26} textAnchor="middle" fontSize="11" fill="#6b6b6b">
        prenhez estimada
      </text>
    </svg>
  );
}

// Mensagens decorativas — spec seção 6.5 (tempos aproximados)
const LOADING_MESSAGES = [
  "Lendo o histórico do animal...",       // 0 - 500ms
  "Cruzando com dados genéticos...",      // 500ms - 1s
  "Calculando a probabilidade...",        // 1s - 2s
  "Quase pronto...",                      // >2s
];

/* ── Aba: Predição ─────────────────────────────────────────────── */
function TabPredicao() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [userSelectedAnimal, setUserSelectedAnimal] = useState<Animal | null>(null);
  const [predicao, setPredicao] = useState<PredicaoPrenhez | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [loadingTooLong, setLoadingTooLong] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const chartTheme = useChartTheme();

  const animalIdParam = searchParams.get("animal_id");

  const { data: preselectedData } = useQuery({
    queryKey: ["animais", "detail", animalIdParam],
    queryFn: ({ signal }) => animaisApi.buscar(animalIdParam!, signal),
    enabled: !!animalIdParam && !userSelectedAnimal,
  });

  const selectedAnimal = userSelectedAnimal ?? preselectedData?.data ?? null;

  const { data: animaisData } = useQuery({
    queryKey: ["animais", "list", { q: debouncedSearch, sexo: "FEMEA", status: "ATIVA", limit: 8 }],
    queryFn: ({ signal }) =>
      animaisApi.listar({ q: debouncedSearch, sexo: "FEMEA", status: "ATIVA", limit: 8 }, signal),
    enabled: debouncedSearch.length > 1 && !selectedAnimal,
  });

  const rodar = useMutation({
    mutationFn: () => iaApi.predicao({ animal_id: selectedAnimal!.id }),
    onSuccess: (data) => {
      setPredicao(data.data);
      void qc.invalidateQueries({ queryKey: ["alertas", "list"] });
      void qc.invalidateQueries({ queryKey: ["alertas", "contagem"] });
    },
  });

  useEffect(() => {
    if (!rodar.isPending) {
      setLoadingMsg(0);
      setLoadingTooLong(false);
      return;
    }
    // Progressão time-based conforme spec seção 6.5
    const timers = [
      setTimeout(() => setLoadingMsg(1), 500),
      setTimeout(() => setLoadingMsg(2), 1000),
      setTimeout(() => setLoadingMsg(3), 2000),
      setTimeout(() => setLoadingTooLong(true), 5000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [rodar.isPending]);

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
          <p className="text-[11px] text-ink-4 mt-0.5">Busca apenas fêmeas com status <strong>ATIVA</strong>.</p>
          {sugestoes.length > 0 && (
            <div className="mt-1 border border-line rounded-[10px] bg-surface overflow-hidden shadow-[var(--shadow-sm)]">
              {sugestoes.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-beige transition-colors border-b border-line last:border-0"
                  onClick={() => {
                    setUserSelectedAnimal(a);
                    setSearch("");
                  }}
                >
                  <strong>{a.nome}</strong>{" "}
                  <span className="font-mono text-ink-4">{a.codigo}</span>
                </button>
              ))}
            </div>
          )}
          {debouncedSearch.length > 1 && sugestoes.length === 0 && (
            <p className="text-[12px] text-ink-4 mt-1">
              Nenhuma fêmea com status <strong>ATIVA</strong> encontrada para "{debouncedSearch}".
              Animais com status Prenha ou Em Monitoramento não aparecem aqui.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Animal context card */}
          <Card padding="sm" className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-white font-bold text-[15px] shrink-0">
              {selectedAnimal.nome.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold text-ink truncate">{selectedAnimal.nome}</p>
              <p className="text-[12px] text-ink-3 font-mono">
                {selectedAnimal.codigo} · CC atual: {selectedAnimal.condicao_corporal} · {selectedAnimal.num_partos} partos
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setUserSelectedAnimal(null);
                  setPredicao(null);
                }}
              >
                Trocar
              </Button>
              {!predicao && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => rodar.mutate()}
                  loading={rodar.isPending}
                  disabled={!isOnline}
                  title={!isOnline ? "Predição IA requer conexão com a internet" : undefined}
                >
                  <Brain size={15} /> Rodar Predição
                </Button>
              )}
              {!isOnline && !predicao && (
                <p className="text-[12px] text-ink-3">
                  A Predição IA requer conexão. Disponível quando online.
                </p>
              )}
            </div>
          </Card>

          {/* Loading com mensagens rotativas — spec seção 6.5 */}
          {rodar.isPending && (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-[3px] border-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[15px] font-semibold text-ink">Analisando…</p>
              <p className="text-[13px] text-ink-4 font-mono mt-1 h-5 transition-all" aria-live="polite">
                {LOADING_MESSAGES[loadingMsg]}
              </p>
              {loadingTooLong && (
                <div className="mt-4 flex flex-col items-center gap-2">
                  <p className="text-[12px] text-ink-3">Está demorando mais que o esperado...</p>
                  <button
                    className="text-[13px] text-danger hover:underline"
                    onClick={() => rodar.reset()}
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Result */}
          {predicao && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col md:flex-row gap-5">
                {/* Gauge card */}
                <Card padding="sm" className="flex flex-col items-center gap-3 md:w-[260px] shrink-0">
                  <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-[0.07em] self-start">
                    Resultado da Predição
                  </p>
                  <GaugeSVG pct={predicao.score_percentual} />
                  <Badge
                    variant={predicao.classificacao === "FAVORAVEL" ? "ok" : "danger"}
                    className="text-[13px] px-4"
                  >
                    {predicao.classificacao === "FAVORAVEL" ? "✓ Favorável" : "✗ Desfavorável"}
                  </Badge>
                  <p className="text-[11px] text-ink-4 font-mono">
                    {predicao.modelo_versao} · {predicao.processado_em_ms}ms
                  </p>
                </Card>

                {/* Recomendações card */}
                <Card padding="sm" className="flex-1 flex flex-col gap-3">
                  <p className="text-[13px] font-semibold text-ink-2">Recomendações</p>
                  {predicao.recomendacoes.map((r, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <span className="w-5 h-5 rounded-full bg-green-700/15 text-green-700 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-[13px] text-ink">{r}</p>
                    </div>
                  ))}
                    {predicao.aviso_clinico && (
                    <div className="flex gap-3 p-3 rounded-[12px] bg-warn-bg border border-warn/20 mt-1">
                      <AlertTriangle size={16} className="text-warn shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[12px] font-semibold text-warn">Atenção Clínica</p>
                        <p className="text-[12px] text-warn mt-0.5">{predicao.aviso_clinico}</p>
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              {/* Fatores */}
              {fatoresChart.length > 0 && (
                <Card padding="sm">
                  <div className="mb-3">
                    <p className="text-[13px] font-semibold text-ink-2">Top fatores determinantes</p>
                    <p className="text-[11px] text-ink-4">
                      Impacto relativo de cada variável no score
                    </p>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart
                      data={fatoresChart}
                      layout="vertical"
                      margin={{ top: 0, right: 16, bottom: 0, left: 130 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={chartTheme.gridColor}
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: chartTheme.textColor }}
                        unit="%"
                      />
                      <YAxis
                        dataKey="label"
                        type="category"
                        tick={{ fontSize: 11, fill: chartTheme.textColor }}
                        width={120}
                      />
                      <Tooltip
                        contentStyle={{
                          background: chartTheme.tooltipBg,
                          border: "1px solid #e6e3dc",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        formatter={(v) => [`${String(v)}%`, "Impacto"] as [string, string]}
                      />
                      <Bar dataKey="impacto" radius={[0, 4, 4, 0]}>
                        {fatoresChart.map((f, i) => (
                          <Cell
                            key={i}
                            fill={
                              f.sentido === "POSITIVO"
                                ? chartTheme.successColor
                                : chartTheme.dangerColor
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* Aviso clínico hardcoded — SEMPRE visível independente da API */}
              <div className="flex gap-3 p-4 rounded-[12px] bg-warn-bg border border-warn/30">
                <AlertTriangle size={18} className="text-warn shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-semibold text-warn">Aviso Clínico Importante</p>
                  <p className="text-[12px] text-warn/90 mt-0.5">
                    Este score não substitui o julgamento clínico veterinário. A decisão de inseminação deve sempre ser tomada por profissional habilitado, considerando o exame físico e o histórico completo do animal.
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Button variant="secondary" size="sm" onClick={() => setPredicao(null)}>
                  Nova Análise
                </Button>
                {predicao.classificacao === "FAVORAVEL" && selectedAnimal && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => void navigate(`/inseminacao?animal_id=${selectedAnimal.id}`)}
                  >
                    <Syringe size={14} /> Registrar Inseminação
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Aba: Padrões de Fertilidade ───────────────────────────────── */
function TabPadroes() {
  const chartTheme = useChartTheme();

  const { data, isLoading } = useQuery({
    queryKey: ["ia", "padroes-fertilidade"],
    queryFn: ({ signal }) => iaApi.padroes(undefined, signal),
  });

  const padroes = data?.data;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-56 animate-pulse bg-beige rounded-[14px]" />
        ))}
      </div>
    );
  }

  if (!padroes) return null;

  if (!padroes.minimo_inseminacoes_atingido) {
    return (
      <div className="flex flex-col items-center py-16 gap-3">
        <AlertTriangle size={32} className="text-warn" />
        <p className="text-[15px] font-semibold text-ink">Dados insuficientes</p>
        <p className="text-[14px] text-ink-3">
          São necessárias ao menos 20 inseminações para análise de padrões.
        </p>
      </div>
    );
  }

  const barProps = {
    contentStyle: {
      background: chartTheme.tooltipBg,
      border: "1px solid #e6e3dc",
      borderRadius: 8,
      fontSize: 12,
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card padding="sm">
        <div className="mb-3">
          <p className="text-[13px] font-semibold text-ink-2">Taxa de prenhez por mês</p>
          <p className="text-[11px] text-ink-4">Percentual de sucesso mensal</p>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={padroes.por_mes}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
            <XAxis dataKey="mes" tick={{ fontSize: 10, fill: chartTheme.textColor }} />
            <YAxis tick={{ fontSize: 10, fill: chartTheme.textColor }} unit="%" />
            <Tooltip
              {...barProps}
              formatter={(v) => [`${String(v)}%`, "Taxa"] as [string, string]}
            />
            <Bar dataKey="taxa" fill={chartTheme.primaryColor} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card padding="sm">
        <div className="mb-3">
          <p className="text-[13px] font-semibold text-ink-2">Taxa por raça</p>
          <p className="text-[11px] text-ink-4">Comparativo entre raças do rebanho</p>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={padroes.por_raca} layout="vertical" margin={{ left: 60 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={chartTheme.gridColor}
              horizontal={false}
            />
            <XAxis type="number" tick={{ fontSize: 10, fill: chartTheme.textColor }} unit="%" />
            <YAxis
              dataKey="raca"
              type="category"
              tick={{ fontSize: 10, fill: chartTheme.textColor }}
              width={55}
            />
            <Tooltip
              {...barProps}
              formatter={(v) => [`${String(v)}%`, "Taxa"] as [string, string]}
            />
            <Bar dataKey="taxa" fill={chartTheme.secondaryColor} radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card padding="sm">
        <div className="mb-3">
          <p className="text-[13px] font-semibold text-ink-2">Taxa por técnico</p>
          <p className="text-[11px] text-ink-4">Performance por responsável</p>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={padroes.por_tecnico} layout="vertical" margin={{ left: 90 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={chartTheme.gridColor}
              horizontal={false}
            />
            <XAxis type="number" tick={{ fontSize: 10, fill: chartTheme.textColor }} unit="%" />
            <YAxis
              dataKey="tecnico_nome"
              type="category"
              tick={{ fontSize: 10, fill: chartTheme.textColor }}
              width={85}
            />
            <Tooltip
              {...barProps}
              formatter={(v) => [`${String(v)}%`, "Taxa"] as [string, string]}
            />
            <Bar dataKey="taxa" fill={chartTheme.successColor} radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card padding="sm">
        <div className="mb-3">
          <p className="text-[13px] font-semibold text-ink-2">Taxa por protocolo</p>
          <p className="text-[11px] text-ink-4">Eficácia por protocolo utilizado</p>
        </div>
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

      {/* Tabela top reprodutores */}
      {padroes.top_reprodutores && padroes.top_reprodutores.length > 0 && (
        <Card padding="sm" className="md:col-span-2">
          <div className="mb-3">
            <p className="text-[13px] font-semibold text-ink-2">Top reprodutores por taxa de prenhez</p>
            <p className="text-[11px] text-ink-4">Ordenados por eficácia reprodutiva no rebanho</p>
          </div>
          <div className="overflow-hidden rounded-[10px] border border-line">
            <table className="w-full">
              <thead>
                <tr className="bg-beige border-b border-line">
                  {["Reprodutor", "Inseminações", "Taxa de Prenhez"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-ink-2 uppercase tracking-[0.04em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {padroes.top_reprodutores.map((r, i) => (
                  <tr key={i} className="border-b border-line last:border-0 hover:bg-beige/50 transition-colors">
                    <td className="px-3 py-2.5">
                      <Link
                        to={`/reprodutores?q=${encodeURIComponent(r.reprodutor)}`}
                        className="text-[13px] font-medium text-green-700 hover:underline"
                      >
                        {r.reprodutor}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-[13px] text-ink-2">{r.inseminacoes}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[13px] font-semibold ${r.taxa_prenhez >= 75 ? "text-ok" : r.taxa_prenhez >= 60 ? "text-warn" : "text-danger"}`}>
                        {r.taxa_prenhez}%
                      </span>
                    </td>
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

/* ── Aba: Seleção Genética ─────────────────────────────────────── */
const CRITERIOS = [
  { id: "fertilidade", label: "Fertilidade (DEP)", icon: "🧬" },
  { id: "peso_desmame", label: "Peso ao desmame", icon: "⚖️" },
  { id: "heterose", label: "Heterose estimada", icon: "🔀" },
  { id: "endogamia", label: "Risco de endogamia", icon: "⚠️" },
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

  type Recomendacao = {
    matriz: string;
    reprodutor: string;
    score_genetico: number;
    heterose_esperada: string;
    risco_endogamia: string;
  };

  const recomendacoes = resultado?.recomendacoes as Recomendacao[] | undefined;

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <Card padding="sm">
        <p className="text-[13px] font-semibold text-ink-2 mb-3">Critérios de seleção</p>
        <div className="grid grid-cols-2 gap-2">
          {CRITERIOS.map((c) => (
            <label
              key={c.id}
              className={[
                "flex items-center gap-2.5 px-3 py-2.5 rounded-[12px] border cursor-pointer transition-all text-[13px]",
                criteriosSelecionados.includes(c.id)
                  ? "border-green-700 bg-green-700/10 text-green-700 font-medium shadow-[0_0_0_1px_var(--color-green-700)]"
                  : "border-line bg-surface text-ink-2 hover:bg-beige",
              ].join(" ")}
            >
              <input
                type="checkbox"
                className="accent-green-700"
                checked={criteriosSelecionados.includes(c.id)}
                onChange={() => toggleCriterio(c.id)}
              />
              <span className="text-[16px]">{c.icon}</span>
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

      {resultado && recomendacoes && (
        <Card padding="sm">
          <div className="mb-3">
            <p className="text-[13px] font-semibold text-ink-2">Pares recomendados</p>
            <p className="text-[11px] text-ink-4">
              {recomendacoes.length} par(es) selecionado(s) por score genético
            </p>
          </div>

          {/* Mobile: cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {recomendacoes.map((r, i) => (
              <div
                key={i}
                className="rounded-[12px] border border-line bg-beige p-3 flex flex-col gap-2"
              >
                <div className="flex justify-between items-center">
                  <p className="text-[13px] font-semibold text-ink">{r.matriz}</p>
                  <span className="text-[14px] font-bold text-green-700">{r.score_genetico}</span>
                </div>
                <p className="text-[12px] text-ink-3">{r.reprodutor}</p>
                <div className="flex gap-3 text-[12px]">
                  <span className="text-ink-4">
                    Heterose: <strong className="text-ink-2">{r.heterose_esperada}</strong>
                  </span>
                  <span className="text-ink-4">
                    Risco: <strong className="text-ink-2">{r.risco_endogamia}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block overflow-hidden rounded-[10px] border border-line">
            <table className="w-full">
              <thead>
                <tr className="bg-beige border-b border-line">
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-ink-2 uppercase tracking-[0.04em]">Matriz</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-ink-2 uppercase tracking-[0.04em]">Reprodutor</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-ink-2 uppercase tracking-[0.04em] cursor-help" title="Diferença esperada de performance da progênie em relação à média da raça (DEP)">
                    Score Genético ⓘ
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-ink-2 uppercase tracking-[0.04em] cursor-help" title="Ganho de performance por cruzamento de raças distintas. Quanto maior, melhor o aproveitamento genético">
                    Heterose ⓘ
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-ink-2 uppercase tracking-[0.04em] cursor-help" title="Probabilidade (F) de genes idênticos por descendência. Acima de 6,25% indica risco elevado de endogamia">
                    Risco Endogamia ⓘ
                  </th>
                </tr>
              </thead>
              <tbody>
                {recomendacoes.map((r, i) => {
                  const fValue = parseFloat(r.risco_endogamia);
                  const isHighEndogamia = !isNaN(fValue) && fValue > 0.0625;
                  return (
                    <tr key={i} className={`border-b border-line last:border-0 hover:bg-beige/50 transition-colors ${isHighEndogamia ? "bg-warn-bg/40" : ""}`}>
                      <td className="px-3 py-2.5 text-[13px] font-medium text-ink">{r.matriz}</td>
                      <td className="px-3 py-2.5 text-[13px] text-ink-2">{r.reprodutor}</td>
                      <td className="px-3 py-2.5">
                        <span className="text-[14px] font-bold text-green-700">{r.score_genetico}</span>
                      </td>
                      <td className="px-3 py-2.5 text-[13px] text-ink-3">{r.heterose_esperada}</td>
                      <td className="px-3 py-2.5 text-[13px]">
                        <span className={isHighEndogamia ? "text-warn font-semibold flex items-center gap-1" : "text-ink-3"}>
                          {isHighEndogamia && <AlertTriangle size={12} />}
                          {(fValue * 100).toFixed(1)}%
                          {isHighEndogamia && <span className="text-[10px] font-normal">— Risco elevado</span>}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ── Página Principal ──────────────────────────────────────────── */
export function AnaliseIAPage() {
  const [tab, setTab] = useState<Tab>("predicao");

  const tabs: { id: Tab; label: string; icon: typeof Brain }[] = [
    { id: "predicao", label: "Predição de Prenhez", icon: Brain },
    { id: "padroes", label: "Padrões de Fertilidade", icon: TrendingUp },
    { id: "selecao", label: "Seleção Genética", icon: Dna },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1
            className="text-[22px] font-bold text-ink"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Análise IA
          </h1>
          <span className="text-[10px] font-bold bg-amber-soft text-amber px-2 py-0.5 rounded-[6px] font-mono tracking-wider">
            IA
          </span>
        </div>
        <p className="text-[14px] text-ink-3 mt-0.5">
          Predição, padrões reprodutivos e seleção genética
        </p>
      </div>

      {/* Tabs — scroll horizontal no mobile */}
      <div className="flex border-b border-line overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch]">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={[
              "flex items-center gap-2 px-5 py-3 text-[14px] font-medium border-b-2 transition-colors flex-shrink-0 whitespace-nowrap",
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
