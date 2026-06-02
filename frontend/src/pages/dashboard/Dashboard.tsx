import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ComposedChart,
} from "recharts";
import {
  AlertCircle, AlertTriangle, TrendingUp, TrendingDown,
  Syringe, Scale, Stethoscope, Baby, Bell, Tractor, PawPrint,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { dashboardApi } from "@/lib/api/endpoints/dashboard";
import { alertasApi } from "@/lib/api/endpoints/alertas";
import { useChartTheme } from "@/hooks/useChartTheme";
import { formatRelativeTime } from "@/lib/utils";
import type { DashboardKPI, TimelineItem } from "@/types";

/* ── KPI Card ──────────────────────────────────────────────────── */

function KPICard({
  label, value, meta, badge, trend, onClick,
}: {
  label: string;
  value: string | number;
  meta?: string;
  badge?: "ok" | "warn" | "danger";
  trend?: { pct: number; sentido: "up" | "down" };
  onClick?: () => void;
}) {
  const cls = onClick ? "cursor-pointer hover:border-green-200 transition-colors" : "";
  return (
    <Card className={`flex flex-col gap-2 ${cls}`} onClick={onClick}>
      <p className="text-[13px] font-medium text-ink-3">{label}</p>
      <div className="flex items-end gap-2">
        <span className="text-[32px] font-bold text-ink leading-none" style={{ fontFamily: "var(--font-display)" }}>
          {value}
        </span>
        {badge && (
          <Badge variant={badge} className="mb-1">
            {badge === "ok" ? "Ótimo" : badge === "warn" ? "Atenção" : "Crítico"}
          </Badge>
        )}
      </div>
      {meta && <p className="text-[13px] text-ink-3">{meta}</p>}
      {trend && (
        <div className={`flex items-center gap-1 text-[13px] font-semibold ${trend.sentido === "up" ? "text-ok" : "text-danger"}`}>
          {trend.sentido === "up" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {trend.pct}% vs mês anterior
        </div>
      )}
    </Card>
  );
}

function KPISection({ data }: { data: DashboardKPI }) {
  const navigate = useNavigate();
  const { por_especie } = data.total_animais;

  const prenhesBadge: "ok" | "warn" | "danger" =
    data.taxa_prenhez.percentual >= 60 ? "ok"
    : data.taxa_prenhez.percentual >= 40 ? "warn"
    : "danger";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        label="Animais cadastrados"
        value={data.total_animais.total}
        meta={`${por_especie.bovino} bov · ${por_especie.ovino} ovi · ${por_especie.caprino} cap`}
      />
      <KPICard
        label="Inseminações no mês"
        value={data.inseminacoes_mes.total}
        trend={{ pct: data.inseminacoes_mes.delta_pct, sentido: data.inseminacoes_mes.sentido }}
      />
      <KPICard
        label="Taxa de prenhez"
        value={`${data.taxa_prenhez.percentual}%`}
        meta={data.taxa_prenhez.periodo}
        badge={prenhesBadge}
      />
      <KPICard
        label="Alertas ativos"
        value={data.alertas_ativos.total}
        meta={`${data.alertas_ativos.criticos} críticos · ${data.alertas_ativos.altos} altos`}
        badge={data.alertas_ativos.criticos > 0 ? "danger" : data.alertas_ativos.altos > 0 ? "warn" : "ok"}
        onClick={() => void navigate("/dashboard#alertas")}
      />
    </div>
  );
}

/* ── Chart ─────────────────────────────────────────────────────── */

const PERIOD_OPTIONS = [
  { label: "3M", value: 3 },
  { label: "6M", value: 6 },
  { label: "12M", value: 12 },
];

function ReproductiveChart() {
  const [meses, setMeses] = useState(6);
  const { data } = useQuery({
    queryKey: ["dashboard", "grafico", { meses }],
    queryFn: ({ signal }) => dashboardApi.grafico(undefined, meses, signal),
  });
  const theme = useChartTheme();
  const points = data?.data ?? [];

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-semibold text-ink" style={{ fontFamily: "var(--font-display)" }}>
          Desempenho reprodutivo
        </h2>
        <div className="flex gap-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMeses(opt.value)}
              className={[
                "px-3 py-1 rounded-[8px] text-[12px] font-semibold transition-colors",
                meses === opt.value
                  ? "bg-green-700 text-white"
                  : "text-ink-3 hover:bg-beige",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={points} margin={{ top: 0, right: 16, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
          <XAxis dataKey="mes" tick={{ fontSize: 12, fill: theme.textColor }} />
          <YAxis yAxisId="left" tick={{ fontSize: 12, fill: theme.textColor }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: theme.textColor }} unit="%" />
          <Tooltip
            contentStyle={{ background: theme.tooltipBg, border: `1px solid ${theme.gridColor}`, borderRadius: 10, fontSize: 13 }}
          />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          <Bar yAxisId="left" dataKey="inseminacoes" name="Inseminações" fill={theme.primaryColor} radius={[4, 4, 0, 0]} />
          <Line yAxisId="right" type="monotone" dataKey="taxa_prenhez" name="Taxa prenhez %" stroke={theme.successColor} strokeWidth={2} dot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
}

/* ── Timeline ──────────────────────────────────────────────────── */

const TIMELINE_ICONS: Record<string, typeof Syringe> = {
  INSEMINACAO: Syringe,
  PESAGEM: Scale,
  DIAGNOSTICO: Stethoscope,
  PARTO: Baby,
  ALERTA: Bell,
};

const TIMELINE_COLORS: Record<string, string> = {
  INSEMINACAO: "bg-green-100 text-green-700",
  PESAGEM: "bg-amber-bg text-amber",
  DIAGNOSTICO: "bg-ok-bg text-ok",
  PARTO: "bg-warn-bg text-warn",
  ALERTA: "bg-danger-bg text-danger",
};

function TimelineSection({ items }: { items: TimelineItem[] }) {
  const navigate = useNavigate();

  return (
    <Card>
      <h2 className="text-[15px] font-semibold text-ink mb-4" style={{ fontFamily: "var(--font-display)" }}>
        Atividade recente
      </h2>
      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const Icon = TIMELINE_ICONS[item.tipo] ?? Bell;
          const colorCls = TIMELINE_COLORS[item.tipo] ?? "bg-beige text-ink-3";
          return (
            <button
              key={item.id}
              className="flex gap-3 items-start text-left hover:bg-beige/50 rounded-[8px] p-1 -m-1 transition-colors"
              onClick={() => void navigate(`/animais/${item.animal.id}`)}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${colorCls}`}>
                <Icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-ink leading-snug">{item.descricao}</p>
                <p className="text-[11px] text-ink-4 mt-0.5 font-mono">
                  {item.animal.codigo} · {formatRelativeTime(item.data)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

/* ── Urgent Alerts ─────────────────────────────────────────────── */

function UrgentAlerts() {
  const { data } = useQuery({
    queryKey: ["alertas", "list", { lido: false, resolvido: false }],
    queryFn: ({ signal }) => alertasApi.listar({ lido: false, resolvido: false }, signal),
  });

  const alerts = useMemo(() => (data?.data ?? []).slice(0, 6), [data]);

  if (alerts.length === 0) return null;

  return (
    <Card id="alertas">
      <h2 className="text-[15px] font-semibold text-ink mb-4" style={{ fontFamily: "var(--font-display)" }}>
        Alertas urgentes
      </h2>
      <div className="flex flex-col gap-2">
        {alerts.map((a) => (
          <div
            key={a.id}
            className={[
              "flex gap-3 p-3 rounded-[10px] border",
              a.prioridade === "CRITICA"
                ? "border-danger bg-danger-bg"
                : "border-warn-bg bg-warn-bg/50",
            ].join(" ")}
          >
            {a.prioridade === "CRITICA" ? (
              <AlertCircle size={16} className="text-danger shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={16} className="text-warn shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-ink leading-snug">{a.mensagem}</p>
              <p className="text-[11px] text-ink-4 mt-0.5 font-mono">
                {a.animal.codigo} · {formatRelativeTime(a.data_disparo)}
              </p>
            </div>
          </div>
        ))}
      </div>
      <button
        className="mt-3 w-full text-[13px] text-green-700 font-medium hover:underline"
        onClick={() => {
          const el = document.getElementById("alertas");
          el?.scrollIntoView({ behavior: "smooth" });
        }}
      >
        Ver todos os alertas →
      </button>
    </Card>
  );
}

/* ── Empty states ──────────────────────────────────────────────── */

// Usado no FLUXO-07 (onboarding) — chamado quando user não tem fazendas
export function EmptySemFazenda() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
        <Tractor size={28} className="text-green-700" />
      </div>
      <h3 className="text-[18px] font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
        Bem-vindo ao AgroGen IA!
      </h3>
      <p className="text-[14px] text-ink-3 max-w-sm">
        Cadastre sua primeira fazenda para começar a usar a plataforma.
      </p>
      <button
        className="px-5 py-2.5 rounded-[10px] bg-green-700 text-white text-[14px] font-semibold hover:bg-green-800 transition-colors"
        onClick={() => void navigate("/perfil")}
      >
        Cadastrar fazenda
      </button>
    </div>
  );
}

function EmptySemAnimais() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
        <PawPrint size={28} className="text-green-700" />
      </div>
      <h3 className="text-[18px] font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
        Sua fazenda está pronta — agora vamos cadastrar o rebanho.
      </h3>
      <p className="text-[14px] text-ink-3 max-w-sm">
        Adicione seu primeiro animal para começar a acompanhar o desempenho reprodutivo.
      </p>
      <button
        className="px-5 py-2.5 rounded-[10px] bg-green-700 text-white text-[14px] font-semibold hover:bg-green-800 transition-colors"
        onClick={() => void navigate("/animais")}
      >
        Cadastrar primeiro animal
      </button>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────── */

export function DashboardPage() {
  const { data: kpisData, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ["dashboard", "kpis"],
    queryFn: ({ signal }) => dashboardApi.kpis(undefined, signal),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
  const { data: timelineData } = useQuery({
    queryKey: ["dashboard", "timeline"],
    queryFn: ({ signal }) => dashboardApi.timeline(signal),
  });

  const kpis = kpisData?.data;
  const timeline = timelineData?.data ?? [];

  const lastUpdate = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6 flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
            Dashboard
          </h1>
          <p className="text-[13px] text-ink-3 mt-0.5">Visão geral do rebanho</p>
        </div>
        {lastUpdate && (
          <p className="text-[12px] text-ink-4 mt-1 shrink-0">
            Atualizado às {lastUpdate}
          </p>
        )}
      </div>

      {isLoading || !kpis ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="h-28 animate-pulse bg-beige">{null}</Card>
            ))}
          </div>
          <Card className="h-72 animate-pulse bg-beige">{null}</Card>
        </>
      ) : kpis.total_animais.total === 0 ? (
        <EmptySemAnimais />
      ) : (
        <>
          <KPISection data={kpis} />
          <ReproductiveChart />
          <div className="grid lg:grid-cols-[3fr_2fr] gap-4">
            <TimelineSection items={timeline} />
            <UrgentAlerts />
          </div>
        </>
      )}
    </div>
  );
}
