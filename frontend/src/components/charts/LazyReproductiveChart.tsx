import { lazy, Suspense } from "react";
import { ChartSkeleton } from "@/components/ui/skeletons/ChartSkeleton";

// Recharts pesa ~260KB — carregado apenas quando o componente monta
const ReproductiveChartImpl = lazy(() =>
  import("./ReproductiveChartImpl").then((m) => ({ default: m.ReproductiveChartImpl }))
);

interface Props {
  height?: number;
}

export function LazyReproductiveChart({ height = 260 }: Props) {
  return (
    <Suspense fallback={<ChartSkeleton height={height} />}>
      <ReproductiveChartImpl height={height} />
    </Suspense>
  );
}
