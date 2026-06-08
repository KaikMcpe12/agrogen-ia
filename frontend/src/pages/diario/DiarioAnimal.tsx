import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { animaisApi } from "@/lib/api/endpoints/animais";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DiarioContent } from "./DiarioList";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { StatusAnimal, Especie } from "@/types";

const STATUS_VARIANT: Record<StatusAnimal, "ok" | "info" | "ghost" | "danger" | "bovino" | "warn"> = {
  ATIVA: "ok", PRENHA: "info", EM_REPOUSO: "warn", DESCARTADA: "danger",
  REPRODUTOR_ATIVO: "bovino", EM_MONITORAMENTO: "warn",
};
const STATUS_LABELS: Record<StatusAnimal, string> = {
  ATIVA: "Ativa", PRENHA: "Prenha", EM_REPOUSO: "Em repouso", DESCARTADA: "Descartada",
  REPRODUTOR_ATIVO: "Reprodutor", EM_MONITORAMENTO: "Monitoramento",
};
const ESPECIE_EMOJI: Record<Especie, string> = { BOVINO: "🐄", OVINO: "🐑", CAPRINO: "🐐" };

export function DiarioAnimalPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["animais", "detail", id],
    queryFn: ({ signal }) => animaisApi.buscar(id!, signal),
    enabled: !!id,
  });

  useEffect(() => {
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (id && UUID_RE.test(id)) {
      try {
        const stored = (JSON.parse(localStorage.getItem(STORAGE_KEYS.lastAnimaisIds) ?? "[]") as string[]).filter((x) => UUID_RE.test(x));
        const updated = [id, ...stored.filter((x) => x !== id)].slice(0, 5);
        localStorage.setItem(STORAGE_KEYS.lastAnimaisIds, JSON.stringify(updated));
      } catch { /* noop */ }
    }
  }, [id]);

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
      <Link
        to="/diario-de-bordo"
        className="flex items-center gap-2 text-[14px] text-ink-3 hover:text-ink transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Voltar ao Diário de Bordo
      </Link>

      {/* Card de identificação sticky */}
      <div className="sticky top-0 z-10 bg-bg pt-1 pb-2">
        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-green-100 flex items-center justify-center text-xl shrink-0">
            {ESPECIE_EMOJI[animal.especie]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[16px] font-bold text-ink truncate">{animal.nome}</p>
              <Badge variant={STATUS_VARIANT[animal.status]}>{STATUS_LABELS[animal.status]}</Badge>
            </div>
            <p className="text-[12px] text-ink-3 font-mono truncate">
              {animal.codigo} · {animal.raca_principal} · {animal.sexo === "FEMEA" ? "♀ Fêmea" : "♂ Macho"}
            </p>
          </div>
          <Link
            to={`/animais/${animal.id}`}
            className="text-[12px] text-green-700 hover:underline shrink-0 hidden sm:block"
          >
            Ver perfil →
          </Link>
        </Card>
      </div>

      <DiarioContent animalId={animal.id} sexo={animal.sexo} />
    </div>
  );
}
