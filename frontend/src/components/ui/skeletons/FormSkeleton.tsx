export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Carregando formulário">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <div className="h-3 bg-beige rounded animate-pulse w-1/4" />
          <div className="h-10 bg-beige rounded-[10px] animate-pulse w-full" />
        </div>
      ))}
    </div>
  );
}
