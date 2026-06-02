import { useMutation, useQueryClient } from "@tanstack/react-query";
import { animaisApi } from "@/lib/api/endpoints/animais";
import { showSuccessToast } from "@/components/ui/toast";

export function useDeleteAnimal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => animaisApi.deletar(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: ["animais", "detail", id] });
      void queryClient.invalidateQueries({ queryKey: ["animais", "list"] });
      void queryClient.invalidateQueries({ queryKey: ["animais", "counts"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "kpis"] });
      showSuccessToast("Animal excluído.");
    },
  });
}
