import { ChartSkeleton } from "./ChartSkeleton";
import { TableSkeleton } from "./TableSkeleton";

export function DiarioTabSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Carregando aba do diário">
      <ChartSkeleton height={200} />
      <TableSkeleton rows={6} />
    </div>
  );
}
