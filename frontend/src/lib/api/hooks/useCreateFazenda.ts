import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fazendasApi } from "@/lib/api/endpoints/fazendas";
import { showSuccessToast } from "@/components/ui/toast";
import type { Fazenda } from "@/types";

export function useCreateFazenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Partial<Fazenda>) => fazendasApi.criar(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["fazendas", "list"] });
      void queryClient.invalidateQueries({ queryKey: ["usuarios", "me"] });
      showSuccessToast("Fazenda cadastrada.");
    },
  });
}
