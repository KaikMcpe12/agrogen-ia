import { useMutation, useQueryClient } from "@tanstack/react-query";
import { diarioApi } from "@/lib/api/endpoints/diario";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { enqueue } from "@/lib/offline/mutationQueue";
import { showSuccessToast, showInfoToast } from "@/components/ui/toast";
import type { EstagioPesagem } from "@/types";

type CreatePesagemInput = {
  animalId: string;
  data: string;
  peso_kg: number;
  estagio: EstagioPesagem;
  observacao?: string;
};

export function useCreatePesagem() {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async ({ animalId, ...body }: CreatePesagemInput) => {
      if (!isOnline) {
        await enqueue({
          endpoint: `/diario/${animalId}/pesagens`,
          method: "POST",
          payload: body,
          invalidateKeys: [
            ["diario", animalId, "pesagens"],
            ["animais", "detail", animalId],
          ],
        });
        return { id: `local:${Date.now()}` };
      }
      const resp = await diarioApi.criarPesagem(animalId, body);
      return resp.data;
    },
    onSuccess: (data, { animalId }) => {
      if (String(data.id).startsWith("local:")) {
        showInfoToast("Pesagem salva localmente. Será enviada quando a conexão voltar.");
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["diario", animalId, "pesagens"] });
      void queryClient.invalidateQueries({ queryKey: ["animais", "detail", animalId] });
      showSuccessToast("Pesagem registrada.");
    },
  });
}
