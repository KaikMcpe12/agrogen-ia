const WIDTHS = ["w-3/4", "w-1/2", "w-2/3", "w-1/3", "w-5/6"];

export function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="rounded-[12px] border border-line overflow-hidden" aria-busy="true" aria-label="Carregando dados">
      <div className="bg-beige border-b border-line px-4 py-3 flex gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-3 bg-line rounded animate-pulse ${WIDTHS[i % WIDTHS.length]}`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3.5 border-b border-line last:border-0">
          {[0, 1, 2, 3].map((j) => (
            <div key={j} className={`h-3 bg-beige rounded animate-pulse ${WIDTHS[(i + j) % WIDTHS.length]}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
