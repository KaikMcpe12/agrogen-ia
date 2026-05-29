import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { animaisApi } from "@/lib/api/endpoints/animais";
import { Card } from "@/components/ui/Card";
import { DiarioContent } from "./DiarioList";

export function DiarioAnimalPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["animal", id],
    queryFn: () => animaisApi.buscar(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-6">
        <div className="h-16 animate-pulse bg-beige rounded-[14px]" />
      </div>
    );
  }

  const animal = data?.data;
  if (!animal) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-6">
        <Card padding="md">
          <p className="text-[14px] text-ink-3">Animal não encontrado.</p>
          <Link to="/diario-de-bordo" className="text-[13px] text-green-700 mt-2 inline-flex items-center gap-1">
            <ArrowLeft size={14} /> Voltar ao Diário
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link to="/diario-de-bordo" className="text-ink-3 hover:text-ink transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-[22px] font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
            {animal.nome}
          </h1>
          <p className="text-[13px] text-ink-3 font-mono">
            {animal.codigo} · {animal.especie} · {animal.raca_principal}
          </p>
        </div>
      </div>

      <DiarioContent animalId={animal.id} />
    </div>
  );
}
