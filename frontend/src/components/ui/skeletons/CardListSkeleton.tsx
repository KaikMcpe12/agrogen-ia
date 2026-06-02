export function CardListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Carregando lista">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface border border-line rounded-[12px] p-4 flex flex-col gap-2.5">
          <div className="h-4 bg-beige rounded animate-pulse w-3/4" />
          <div className="h-3 bg-beige rounded animate-pulse w-1/2" />
          <div className="flex gap-3 mt-1">
            {[0, 1, 2].map((j) => (
              <div key={j} className="h-3 bg-beige rounded animate-pulse w-16" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
