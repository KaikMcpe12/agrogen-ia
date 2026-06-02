import { useMutation, useQueryClient } from "@tanstack/react-query";
import { diarioApi } from "@/lib/api/endpoints/diario";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { enqueue } from "@/lib/offline/mutationQueue";
import { showSuccessToast, showInfoToast } from "@/components/ui/toast";
import type { TipoSanitario, ViaSanitaria } from "@/types";

type CreateSanitarioInput = {
  animalId: string;
  tipo: TipoSanitario;
  produto: string;
  principio_ativo?: string;
  data_aplicacao: string;
  dose?: string;
  via?: ViaSanitaria;
  lote_produto?: string;
  proxima_dose?: string;
};

export function useCreateSanitario() {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async ({ animalId, ...body }: CreateSanitarioInput) => {
      if (!isOnline) {
        const invalidateKeys: Parameters<typeof enqueue>[0]["invalidateKeys"] = [
          ["diario", animalId, "sanitario"],
        ];
        if (body.proxima_dose) invalidateKeys.push(["alertas", "contagem"]);
        await enqueue({
          endpoint: `/diario/${animalId}/sanitario`,
          method: "POST",
          payload: body,
          invalidateKeys,
        });
        return { id: `local:${Date.now()}` };
      }
      const resp = await diarioApi.criarEventoSanitario(animalId, body);
      return resp.data;
    },
    onSuccess: (data, { animalId, proxima_dose }) => {
      if (String(data.id).startsWith("local:")) {
        showInfoToast("Evento sanitário salvo localmente. Será enviado quando a conexão voltar.");
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["diario", animalId, "sanitario"] });
      if (proxima_dose) void queryClient.invalidateQueries({ queryKey: ["alertas", "contagem"] });
      showSuccessToast("Evento sanitário registrado.");
    },
  });
}
