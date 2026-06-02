import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inseminacoesApi } from "@/lib/api/endpoints/inseminacoes";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { enqueue } from "@/lib/offline/mutationQueue";
import { showSuccessToast, showInfoToast } from "@/components/ui/toast";
import type { TipoInseminacao } from "@/types";

type CreateInseminacaoInput = {
  animal_id: string;
  reprodutor_id: string;
  data_inseminacao: string;
  tipo: TipoInseminacao;
  protocolo_descricao?: string;
  condicao_corporal_momento: number;
  temperatura_ambiente_c?: number;
  observacoes?: string;
};

export function useCreateInseminacao() {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async (input: CreateInseminacaoInput) => {
      if (!isOnline) {
        await enqueue({
          endpoint: "/inseminacoes",
          method: "POST",
          payload: input,
          invalidateKeys: [
            ["inseminacoes", "list"],
            ["inseminacoes", "pendentes-diagnostico"],
            ["animais", "detail", input.animal_id],
            ["dashboard", "kpis"],
            ["alertas", "list"],
            ["alertas", "contagem"],
          ],
        });
        return { id: `local:${Date.now()}`, resultado: "PENDENTE" };
      }
      const resp = await inseminacoesApi.criar(input);
      return resp.data;
    },
    onSuccess: (data) => {
      if (String(data.id).startsWith("local:")) {
        showInfoToast("Inseminação salva localmente. Será enviada quando a conexão voltar.");
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["inseminacoes", "list"] });
      void queryClient.invalidateQueries({ queryKey: ["inseminacoes", "pendentes-diagnostico"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "kpis"] });
      void queryClient.invalidateQueries({ queryKey: ["alertas", "list"] });
      void queryClient.invalidateQueries({ queryKey: ["alertas", "contagem"] });
      showSuccessToast("Inseminação registrada.");
    },
  });
}
