import client from "../client";
import type { Reprodutor, PaginatedResponse, ApiResponse, Especie } from "@/types";

export interface ReprodutoresParams {
  fazenda_id?: string;
  q?: string;
  especie?: Especie;
  tipo?: "SEMEN_EXTERNO" | "ANIMAL_PROPRIO";
  ativo?: boolean;
  animal_id?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface CriarReprodutorBody {
  nome: string;
  especie: Especie;
  raca: string;
  tipo: "SEMEN_EXTERNO" | "ANIMAL_PROPRIO";
  animal_id?: string;
  registro?: string;
  empresa_semen?: string;
  dep_peso_desmame?: number;
  dep_fertilidade?: number;
  dep_acuracia?: number;
}

export interface AtualizarReprodutorBody {
  nome?: string;
  raca?: string;
  registro?: string;
  empresa_semen?: string;
  dep_peso_desmame?: number;
  dep_fertilidade?: number;
  dep_acuracia?: number;
  ativo?: boolean;
}

export const reprodutoresApi = {
  listar: (params?: ReprodutoresParams, signal?: AbortSignal) =>
    client.get<PaginatedResponse<Reprodutor>>("/reprodutores", { params, ...(signal ? { signal } : {}) }).then((r) => r.data),

  buscar: (id: string, signal?: AbortSignal) =>
    client.get<ApiResponse<Reprodutor>>(`/reprodutores/${id}`, { ...(signal ? { signal } : {}) }).then((r) => r.data),

  criar: (body: CriarReprodutorBody) =>
    client.post<ApiResponse<Reprodutor>>("/reprodutores", body).then((r) => r.data),

  atualizar: (id: string, body: AtualizarReprodutorBody) =>
    client.patch<ApiResponse<Reprodutor>>(`/reprodutores/${id}`, body).then((r) => r.data),

  deletar: (id: string) =>
    client.delete<ApiResponse<null>>(`/reprodutores/${id}`).then((r) => r.data),
};
