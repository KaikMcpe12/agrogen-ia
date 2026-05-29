import client from "../client";
import type { Inseminacao, PaginatedResponse, ApiResponse, ResultadoInseminacao, TipoInseminacao } from "@/types";

export interface InseminacoesParams {
  fazenda_id?: string;
  animal_id?: string;
  resultado?: ResultadoInseminacao;
  tecnico_id?: string;
  data_inicio?: string;
  data_fim?: string;
  page?: number;
  limit?: number;
}

export const inseminacoesApi = {
  listar: (params?: InseminacoesParams) =>
    client.get<PaginatedResponse<Inseminacao>>("/inseminacoes", { params }).then((r) => r.data),

  pendentes: () =>
    client.get<ApiResponse<Inseminacao[]>>("/inseminacoes/pendentes-diagnostico").then((r) => r.data),

  criar: (body: {
    animal_id: string;
    reprodutor_id: string;
    data_inseminacao: string;
    tipo: TipoInseminacao;
    protocolo_descricao?: string;
    condicao_corporal_momento: number;
    temperatura_ambiente_c?: number;
    observacoes?: string;
  }) => client.post<ApiResponse<{ id: string; resultado: string; alerta_criado?: { id: string } }>>("/inseminacoes", body).then((r) => r.data),

  registrarDiagnostico: (inseminacaoId: string, body: {
    data_diagnostico: string;
    metodo: string;
    resultado: "PRENHA" | "VAZIA" | "INCONCLUSIVO";
    data_parto_prevista?: string;
    veterinario_id?: string;
    observacoes?: string;
  }) =>
    client.post<ApiResponse<{ id: string; resultado: string; animal_status_atualizado: string; alerta_resolvido: boolean }>>(
      `/inseminacoes/${inseminacaoId}/diagnostico`,
      body
    ).then((r) => r.data),
};
