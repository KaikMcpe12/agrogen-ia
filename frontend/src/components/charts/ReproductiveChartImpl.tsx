import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useChartTheme } from "@/hooks/useChartTheme";
import { dashboardApi } from "@/lib/api/endpoints/dashboard";

const PERIOD_OPTIONS = [
  { label: "3M", value: 3 },
  { label: "6M", value: 6 },
  { label: "12M", value: 12 },
];

export function ReproductiveChartImpl({ height = 260 }: { height?: number }) {
  const [meses, setMeses] = useState(6);
  const { data } = useQuery({
    queryKey: ["dashboard", "grafico", { meses }],
    queryFn: ({ signal }) => dashboardApi.grafico(undefined, meses, signal),
  });
  const theme = useChartTheme();
  const points = data?.data ?? [];

  return (
    <div>
      <div className="flex justify-end gap-1 mb-3">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setMeses(opt.value)}
            className={[
              "px-3 py-1 rounded-[8px] text-[12px] font-semibold transition-colors",
              meses === opt.value ? "bg-green-700 text-white" : "text-ink-3 hover:bg-beige",
            ].join(" ")}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={height}>
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
    </div>
  );
}
