import { useMutation, useQueryClient } from "@tanstack/react-query";
import { animaisApi } from "@/lib/api/endpoints/animais";
import { showSuccessToast } from "@/components/ui/toast";
import type { Animal } from "@/types";

export function useUpdateAnimal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Animal> }) =>
      animaisApi.atualizar(id, data),
    onSuccess: (resp, { id }) => {
      const animal = resp.data;
      queryClient.setQueryData(["animais", "detail", id], { data: animal });
      void queryClient.invalidateQueries({ queryKey: ["animais", "list"] });
      void queryClient.invalidateQueries({ queryKey: ["animais", "detail", id] });
      showSuccessToast("Animal atualizado.");
    },
  });
}
