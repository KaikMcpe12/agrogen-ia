import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reprodutoresApi } from "@/lib/api/endpoints/reprodutores";
import type { Reprodutor, ApiResponse } from "@/types";

export function useToggleAtivoReprodutor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      reprodutoresApi.atualizar(id, { ativo }),

    onMutate: async ({ id, ativo }) => {
      await queryClient.cancelQueries({ queryKey: ["reprodutores", "detail", id] });
      const previous = queryClient.getQueryData<ApiResponse<Reprodutor>>(["reprodutores", "detail", id]);
      queryClient.setQueryData<ApiResponse<Reprodutor>>(["reprodutores", "detail", id], (old) => {
        if (!old) return old;
        return { ...old, data: { ...old.data, ativo } };
      });
      return { previous };
    },

    onError: (_err, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["reprodutores", "detail", id], context.previous);
      }
    },

    onSettled: (_, __, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ["reprodutores", "detail", id] });
      void queryClient.invalidateQueries({ queryKey: ["reprodutores", "list"] });
    },
  });
}
