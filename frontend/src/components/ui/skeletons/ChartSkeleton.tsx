import { BarChart2 } from "lucide-react";

export function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div
      className="bg-beige rounded-[12px] flex items-center justify-center animate-pulse"
      style={{ height }}
      aria-busy="true"
      aria-label="Carregando gráfico"
    >
      <BarChart2 size={40} className="text-line" />
    </div>
  );
}
