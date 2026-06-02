import client from "../client";
import type { PredicaoPrenhez, PadroesFertilidade, ApiResponse, Especie } from "@/types";

export const iaApi = {
  predicao: (body: { animal_id: string; condicao_corporal_atual?: number; reprodutor_candidato_id?: string }) =>
    client.post<ApiResponse<PredicaoPrenhez>>("/ia/predicao-prenhez", body).then((r) => r.data),

  padroes: (params?: { fazenda_id?: string; data_inicio?: string; data_fim?: string; especie?: Especie }, signal?: AbortSignal) =>
    client.get<ApiResponse<PadroesFertilidade>>("/ia/padroes-fertilidade", { params, ...(signal ? { signal } : {}) }).then((r) => r.data),

  selecaoGenetica: (body: { criterios: string[] }) =>
    client.post<ApiResponse<{ recomendacoes: unknown[] }>>("/ia/selecao-genetica", body).then((r) => r.data),
};
