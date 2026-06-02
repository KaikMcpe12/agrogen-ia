import { useMutation, useQueryClient } from "@tanstack/react-query";
import { diarioApi } from "@/lib/api/endpoints/diario";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { enqueue } from "@/lib/offline/mutationQueue";
import { showSuccessToast, showInfoToast } from "@/components/ui/toast";
import type { TipoParto } from "@/types";

type CreatePartoInput = {
  animalId: string;
  data_parto: string;
  tipo_parto: TipoParto;
  num_crias: number;
  num_crias_vivas: number;
  peso_total_crias_kg?: number;
  houve_distorcia: boolean;
  houve_obito_matriz: boolean;
  inseminacao_id?: string;
};

export function useCreateParto() {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async ({ animalId, ...body }: CreatePartoInput) => {
      if (!isOnline) {
        await enqueue({
          endpoint: `/diario/${animalId}/partos`,
          method: "POST",
          payload: body,
          invalidateKeys: [
            ["diario", animalId, "partos"],
            ["animais", "detail", animalId],
          ],
        });
        return { id: `local:${Date.now()}` };
      }
      const resp = await diarioApi.criarParto(animalId, body);
      return resp.data;
    },
    onSuccess: (data, { animalId }) => {
      if (String(data.id).startsWith("local:")) {
        showInfoToast("Parto salvo localmente. Será enviado quando a conexão voltar.");
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["diario", animalId, "partos"] });
      void queryClient.invalidateQueries({ queryKey: ["animais", "detail", animalId] });
      showSuccessToast("Parto registrado.");
    },
  });
}
