import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { AlertCircle, AlertTriangle, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { dashboardApi } from "@/lib/api/endpoints/dashboard";
import { alertasApi } from "@/lib/api/endpoints/alertas";
import { useChartTheme } from "@/hooks/useChartTheme";
import type { DashboardKPI, TimelineItem } from "@/types";

function KPICard({ label, value, meta, badge, trend }: {
  label: string;
  value: string | number;
  meta?: string;
  badge?: "ok" | "warn" | "danger";
  trend?: { pct: number; sentido: "up" | "down" };
}) {
  return (
    <Card className="flex flex-col gap-2">
      <p className="text-[13px] font-medium text-ink-3">{label}</p>
      <div className="flex items-end gap-2">
        <span
          className="text-[32px] font-bold text-ink leading-none"
          style={{ fontFamily: "var(--font-display)" }}
        >
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
  const { por_especie } = data.total_animais;
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
        badge={data.taxa_prenhez.badge}
      />
      <KPICard
        label="Alertas ativos"
        value={data.alertas_ativos.total}
        meta={`${data.alertas_ativos.criticos} críticos · ${data.alertas_ativos.altos} altos`}
        badge={data.alertas_ativos.criticos > 0 ? "danger" : data.alertas_ativos.altos > 0 ? "warn" : "ok"}
      />
    </div>
  );
}

function ReproductiveChart() {
  const { data } = useQuery({
    queryKey: ["dashboard", "grafico"],
    queryFn: () => dashboardApi.grafico(),
  });
  const theme = useChartTheme();
  const points = data?.data ?? [];

  return (
    <Card>
      <h2 className="text-[15px] font-semibold text-ink mb-4" style={{ fontFamily: "var(--font-display)" }}>
        Desempenho reprodutivo — últimos 6 meses
      </h2>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={points} margin={{ top: 0, right: 16, left: -20, bottom: 0 }}>
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
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

function TimelineSection({ items }: { items: TimelineItem[] }) {
  return (
    <Card>
      <h2 className="text-[15px] font-semibold text-ink mb-4" style={{ fontFamily: "var(--font-display)" }}>
        Atividade recente
      </h2>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
              <Activity size={14} className="text-green-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-ink leading-snug">{item.descricao}</p>
              <p className="text-[11px] text-ink-4 mt-0.5 font-mono">
                {item.animal.codigo} · {new Date(item.data).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function UrgentAlerts() {
  const { data } = useQuery({
    queryKey: ["alertas", "urgentes"],
    queryFn: () => alertasApi.listar({ lido: false, resolvido: false }),
  });
  const alerts = (data?.data ?? []).slice(0, 5);

  if (alerts.length === 0) return null;

  return (
    <Card>
      <h2 className="text-[15px] font-semibold text-ink mb-4" style={{ fontFamily: "var(--font-display)" }}>
        Alertas urgentes
      </h2>
      <div className="flex flex-col gap-2">
        {alerts.map((a) => (
          <div
            key={a.id}
            className={`flex gap-3 p-3 rounded-[10px] border ${a.prioridade === "CRITICA" ? "border-danger-bg bg-danger-bg/50" : "border-warn-bg bg-warn-bg/50"}`}
          >
            {a.prioridade === "CRITICA" ? (
              <AlertCircle size={16} className="text-danger shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={16} className="text-warn shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-ink leading-snug">{a.mensagem}</p>
              <p className="text-[11px] text-ink-4 mt-0.5 font-mono">
                {new Date(a.data_disparo).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const { data: kpisData, isLoading } = useQuery({
    queryKey: ["dashboard", "kpis"],
    queryFn: () => dashboardApi.kpis(),
    refetchInterval: 5 * 60 * 1000,
  });
  const { data: timelineData } = useQuery({
    queryKey: ["dashboard", "timeline"],
    queryFn: () => dashboardApi.timeline(),
  });

  const kpis = kpisData?.data;
  const timeline = timelineData?.data ?? [];

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6 flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
          Dashboard
        </h1>
        <p className="text-[14px] text-ink-3 mt-1">Visão geral do rebanho</p>
      </div>

      {isLoading || !kpis ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-28 animate-pulse bg-beige">{null}</Card>
          ))}
        </div>
      ) : (
        <KPISection data={kpis} />
      )}

      <ReproductiveChart />

      <div className="grid lg:grid-cols-2 gap-4">
        <TimelineSection items={timeline} />
        <UrgentAlerts />
      </div>
    </div>
  );
}
