import { useMutation, useQueryClient } from "@tanstack/react-query";
import { alertasApi, type AlertasContagemResponse } from "@/lib/api/endpoints/alertas";

export function useMarcarAlertaLido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ alertaId }: { alertaId: string }) =>
      alertasApi.marcarLido(alertaId),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["alertas"] });
      const previous = queryClient.getQueryData<AlertasContagemResponse>(["alertas", "contagem"]);
      queryClient.setQueryData<AlertasContagemResponse>(["alertas", "contagem"], (old) => {
        if (!old) return old;
        return { ...old, data: { ...old.data, nao_lidos: Math.max(0, (old.data.nao_lidos ?? 0) - 1) } };
      });
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["alertas", "contagem"], context.previous);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["alertas", "list"] });
      void queryClient.invalidateQueries({ queryKey: ["alertas", "contagem"] });
    },
  });
}
