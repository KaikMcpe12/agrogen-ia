import { useMutation, useQueryClient } from "@tanstack/react-query";
import { animaisApi } from "@/lib/api/endpoints/animais";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { enqueue } from "@/lib/offline/mutationQueue";
import { showSuccessToast, showInfoToast } from "@/components/ui/toast";
import type { Animal } from "@/types";

export function useCreateAnimal() {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async (input: Partial<Animal>) => {
      if (!isOnline) {
        const queueId = await enqueue({
          endpoint: "/animais",
          method: "POST",
          payload: input,
          invalidateKeys: [["animais", "list"], ["animais", "counts"], ["dashboard", "kpis"]],
          optimisticData: { ...input, id: `local:${Date.now()}`, codigo: "PENDENTE" },
        });
        return { id: `local:${queueId}`, codigo: "PENDENTE", status: "ATIVA" } as Partial<Animal>;
      }
      const resp = await animaisApi.criar(input);
      return resp.data as Partial<Animal>;
    },
    onSuccess: (animal) => {
      if (String(animal.id ?? "").startsWith("local:")) {
        showInfoToast("Animal salvo localmente. Será enviado quando a conexão voltar.");
        return;
      }
      queryClient.setQueryData(["animais", "detail", animal.id], { data: animal });
      void queryClient.invalidateQueries({ queryKey: ["animais", "list"] });
      void queryClient.invalidateQueries({ queryKey: ["animais", "counts"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "kpis"] });
      showSuccessToast(`Animal ${animal.codigo ?? ""} cadastrado.`);
    },
  });
}
