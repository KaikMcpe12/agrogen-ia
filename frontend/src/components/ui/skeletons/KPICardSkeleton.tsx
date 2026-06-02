export function KPICardSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-busy="true" aria-label="Carregando indicadores">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-surface border border-line rounded-[12px] p-4 flex flex-col gap-2">
          <div className="h-3 bg-beige rounded animate-pulse w-2/3" />
          <div className="h-8 bg-beige rounded animate-pulse w-1/2 mt-1" />
          <div className="h-3 bg-beige rounded animate-pulse w-3/4" />
        </div>
      ))}
    </div>
  );
}
