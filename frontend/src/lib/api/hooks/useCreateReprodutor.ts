import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reprodutoresApi, type CriarReprodutorBody } from "@/lib/api/endpoints/reprodutores";
import { showSuccessToast } from "@/components/ui/toast";

export function useCreateReprodutor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CriarReprodutorBody) => reprodutoresApi.criar(body),
    onSuccess: (resp) => {
      const novoReprodutor = resp.data;
      queryClient.setQueryData(["reprodutores", "detail", novoReprodutor.id], { data: novoReprodutor });
      void queryClient.invalidateQueries({ queryKey: ["reprodutores", "list"] });
      showSuccessToast(`Reprodutor ${novoReprodutor.nome} cadastrado.`);
    },
  });
}
