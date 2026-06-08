import client from "../client";
import type { Inseminacao, PaginatedResponse, ApiResponse, ResultadoInseminacao, TipoInseminacao, MetodoDiagnostico } from "@/types";

export interface InseminacoesParams {
  fazenda_id?: string;
  animal_id?: string;
  resultado?: ResultadoInseminacao;
  tecnico_id?: string;
  data_inicio?: string;
  data_fim?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface PendentesParams {
  fazenda_id?: string;
  dias_minimos?: number;
}

export interface PendentesResponse {
  success: boolean;
  data: Inseminacao[];
  meta: { total: number; criticos: number; atencao: number };
}

export const inseminacoesApi = {
  listar: (params?: InseminacoesParams, signal?: AbortSignal) =>
    client.get<PaginatedResponse<Inseminacao>>("/inseminacoes", { params, ...(signal ? { signal } : {}) }).then((r) => r.data),

  pendentes: (params?: PendentesParams, signal?: AbortSignal) =>
    client.get<PendentesResponse>("/inseminacoes/pendentes-diagnostico", { params, ...(signal ? { signal } : {}) }).then((r) => r.data),

  criar: (body: {
    animal_id: string;
    reprodutor_id: string;
    data_inseminacao: string;
    tipo: TipoInseminacao;
    protocolo_descricao?: string | undefined;
    condicao_corporal_momento: number;
    temperatura_ambiente_c?: number | undefined;
    observacoes?: string | undefined;
  }) => client.post<ApiResponse<{ id: string; resultado: string; alerta_criado?: { id: string } }>>("/inseminacoes", body).then((r) => r.data),

  registrarDiagnostico: (inseminacaoId: string, body: {
    data_diagnostico: string;
    metodo: MetodoDiagnostico;
    resultado: "PRENHA" | "VAZIA";
    data_parto_prevista?: string | undefined;
    veterinario_id?: string | undefined;
    observacoes?: string | undefined;
  }) =>
    client.post<ApiResponse<{ id: string; resultado: string; animal_status_atualizado: string; alerta_resolvido: boolean }>>(
      `/inseminacoes/${inseminacaoId}/diagnostico`,
      body
    ).then((r) => r.data),
};
