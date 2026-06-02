import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inseminacoesApi } from "@/lib/api/endpoints/inseminacoes";
import { showSuccessToast } from "@/components/ui/toast";

type DiagnosticoInput = {
  inseminacaoId: string;
  animalId: string;
  data_diagnostico: string;
  metodo: string;
  resultado: "PRENHA" | "VAZIA" | "INCONCLUSIVO";
  data_parto_prevista?: string;
  veterinario_id?: string;
  observacoes?: string;
};

export function useRegistrarDiagnostico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ inseminacaoId, animalId: _, ...body }: DiagnosticoInput) =>
      inseminacoesApi.registrarDiagnostico(inseminacaoId, body),
    onSuccess: (_, { animalId }) => {
      void queryClient.invalidateQueries({ queryKey: ["inseminacoes", "list"] });
      void queryClient.invalidateQueries({ queryKey: ["inseminacoes", "pendentes-diagnostico"] });
      void queryClient.invalidateQueries({ queryKey: ["animais", "detail", animalId] });
      void queryClient.invalidateQueries({ queryKey: ["alertas", "list"] });
      void queryClient.invalidateQueries({ queryKey: ["alertas", "contagem"] });
      showSuccessToast("Diagnóstico registrado.");
    },
  });
}
