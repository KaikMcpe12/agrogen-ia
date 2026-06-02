import client from "../client";
import type { Pesagem, Parto, EventoSanitario, Ocorrencia, PaginatedResponse, ApiResponse, ResumoPesagens, EstagioPesagem, TipoParto, TipoSanitario, ViaSanitaria, CategoriaOcorrencia } from "@/types";

interface PesagensResponse {
  success: boolean;
  data: Pesagem[];
  resumo: ResumoPesagens;
  meta: PaginatedResponse<Pesagem>["meta"];
}

export const diarioApi = {
  pesagens: (animalId: string, signal?: AbortSignal) =>
    client.get<PesagensResponse>(`/diario/${animalId}/pesagens`, { ...(signal ? { signal } : {}) }).then((r) => r.data),

  criarPesagem: (animalId: string, body: { data: string; peso_kg: number; estagio: EstagioPesagem; observacao?: string | undefined }) =>
    client.post<ApiResponse<{ id: string; gmd_calculado?: number }>>(`/diario/${animalId}/pesagens`, body).then((r) => r.data),

  partos: (animalId: string, signal?: AbortSignal) =>
    client.get<PaginatedResponse<Parto>>(`/diario/${animalId}/partos`, { ...(signal ? { signal } : {}) }).then((r) => r.data),

  criarParto: (animalId: string, body: {
    data_parto: string;
    tipo_parto: TipoParto;
    num_crias: number;
    num_crias_vivas: number;
    peso_total_crias_kg?: number | undefined;
    houve_distorcia: boolean;
    houve_obito_matriz: boolean;
    inseminacao_id?: string | undefined;
  }) =>
    client.post<ApiResponse<{ id: string }>>(`/diario/${animalId}/partos`, body).then((r) => r.data),

  sanitario: (animalId: string, signal?: AbortSignal) =>
    client.get<PaginatedResponse<EventoSanitario>>(`/diario/${animalId}/sanitario`, { ...(signal ? { signal } : {}) }).then((r) => r.data),

  criarEventoSanitario: (animalId: string, body: {
    tipo: TipoSanitario;
    produto: string;
    principio_ativo?: string | undefined;
    data_aplicacao: string;
    dose?: string | undefined;
    via?: ViaSanitaria | undefined;
    lote_produto?: string | undefined;
    proxima_dose?: string | undefined;
  }) =>
    client.post<ApiResponse<{ id: string }>>(`/diario/${animalId}/sanitario`, body).then((r) => r.data),

  ocorrencias: (animalId: string, signal?: AbortSignal) =>
    client.get<PaginatedResponse<Ocorrencia>>(`/diario/${animalId}/ocorrencias`, { ...(signal ? { signal } : {}) }).then((r) => r.data),

  criarOcorrencia: (animalId: string, body: {
    data: string;
    categoria: CategoriaOcorrencia;
    titulo: string;
    descricao: string;
    resolvida: boolean;
  }) =>
    client.post<ApiResponse<{ id: string }>>(`/diario/${animalId}/ocorrencias`, body).then((r) => r.data),
};
