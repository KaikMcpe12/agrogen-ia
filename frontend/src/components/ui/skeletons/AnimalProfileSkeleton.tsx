export function AnimalProfileSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Carregando perfil do animal">
      {/* Header */}
      <div className="bg-surface border border-line rounded-[16px] p-5 flex gap-4">
        <div className="w-16 h-16 rounded-full bg-beige animate-pulse shrink-0" />
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-5 bg-beige rounded animate-pulse w-1/2" />
          <div className="h-3 bg-beige rounded animate-pulse w-1/3" />
          <div className="h-3 bg-beige rounded animate-pulse w-2/3" />
        </div>
      </div>
      {/* Cards de bloco */}
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-surface border border-line rounded-[12px] p-4 flex flex-col gap-3">
          <div className="h-4 bg-beige rounded animate-pulse w-1/3" />
          <div className="h-3 bg-beige rounded animate-pulse w-full" />
          <div className="h-3 bg-beige rounded animate-pulse w-5/6" />
        </div>
      ))}
    </div>
  );
}
