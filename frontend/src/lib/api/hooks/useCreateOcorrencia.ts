import { useMutation, useQueryClient } from "@tanstack/react-query";
import { diarioApi } from "@/lib/api/endpoints/diario";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { enqueue } from "@/lib/offline/mutationQueue";
import { showSuccessToast, showInfoToast } from "@/components/ui/toast";
import type { CategoriaOcorrencia } from "@/types";

type CreateOcorrenciaInput = {
  animalId: string;
  data: string;
  categoria: CategoriaOcorrencia;
  titulo: string;
  descricao: string;
  resolvida: boolean;
};

export function useCreateOcorrencia() {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async ({ animalId, ...body }: CreateOcorrenciaInput) => {
      if (!isOnline) {
        await enqueue({
          endpoint: `/diario/${animalId}/ocorrencias`,
          method: "POST",
          payload: body,
          invalidateKeys: [["diario", animalId, "ocorrencias"]],
        });
        return { id: `local:${Date.now()}` };
      }
      const resp = await diarioApi.criarOcorrencia(animalId, body);
      return resp.data;
    },
    onSuccess: (data, { animalId }) => {
      if (String(data.id).startsWith("local:")) {
        showInfoToast("Ocorrência salva localmente. Será enviada quando a conexão voltar.");
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["diario", animalId, "ocorrencias"] });
      showSuccessToast("Ocorrência registrada.");
    },
  });
}
