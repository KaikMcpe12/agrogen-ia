import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Dna } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { reprodutoresApi } from "@/lib/api/endpoints/reprodutores";

export function ReprodutorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["reprodutor", id],
    queryFn: () => reprodutoresApi.buscar(id!),
    enabled: !!id,
  });

  const rep = data?.data;

  if (isLoading) {
    return (
      <div className="max-w-[900px] mx-auto px-4 py-10 flex items-center justify-center gap-3 text-ink-3">
        <Dna size={20} className="animate-spin" />
        <span className="text-[14px]">Carregando perfil do reprodutor...</span>
      </div>
    );
  }

  if (!rep) {
    return (
      <div className="max-w-[900px] mx-auto px-4 py-10 flex flex-col items-center gap-4 text-center">
        <p className="text-[16px] text-ink-2">Reprodutor não encontrado.</p>
        <Button variant="secondary" size="sm" onClick={() => navigate("/reprodutores")}>
          <ArrowLeft size={14} /> Voltar à lista
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 py-6 flex flex-col gap-4">
      <Button variant="ghost" size="sm" className="self-start" onClick={() => navigate("/reprodutores")}>
        <ArrowLeft size={14} /> Voltar à lista
      </Button>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-[12px] bg-green-700/10 flex items-center justify-center">
          <Dna size={22} className="text-green-700" />
        </div>
        <div>
          <h1 className="text-[24px] font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
            {rep.nome}
          </h1>
          <p className="text-[13px] text-ink-3">
            {rep.especie} · {rep.raca} · {rep.tipo === "SEMEN_EXTERNO" ? "Sêmen Externo" : "Animal Próprio"}
          </p>
        </div>
      </div>
      <p className="text-[13px] text-ink-4 bg-beige px-4 py-3 rounded-[10px]">
        Página completa do reprodutor (SUB-04) será implementada no commit C12.
      </p>
    </div>
  );
}
