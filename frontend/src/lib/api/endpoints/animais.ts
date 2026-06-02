import client from "../client";
import type { Animal, PaginatedResponse, ApiResponse, Especie, Sexo, StatusAnimal } from "@/types";

export interface AnimaisParams {
  fazenda_id?: string | undefined;
  q?: string | undefined;
  especie?: Especie | undefined;
  sexo?: Sexo | undefined;
  status?: StatusAnimal | undefined;
  page?: number | undefined;
  limit?: number | undefined;
  sort?: string | undefined;
  order?: "asc" | "desc" | undefined;
}

export interface AnimaisCounts {
  total: number;
  bovino: number;
  ovino: number;
  caprino: number;
  ativa: number;
  prenha: number;
  em_repouso: number;
  descartada: number;
}

export const animaisApi = {
  listar: (params?: AnimaisParams, signal?: AbortSignal) =>
    client.get<PaginatedResponse<Animal>>("/animais", { params, ...(signal ? { signal } : {}) }).then((r) => r.data),

  buscar: (id: string, signal?: AbortSignal) =>
    client.get<ApiResponse<Animal>>(`/animais/${id}`, { ...(signal ? { signal } : {}) }).then((r) => r.data),

  counts: (signal?: AbortSignal) =>
    client.get<ApiResponse<AnimaisCounts>>("/animais/counts", { ...(signal ? { signal } : {}) }).then((r) => r.data),

  criar: (body: Partial<Animal>) =>
    client.post<ApiResponse<Pick<Animal, "id" | "codigo" | "nome" | "status" | "created_at">>>("/animais", body).then((r) => r.data),

  atualizar: (id: string, data: Partial<Animal>) =>
    client.put<ApiResponse<Animal>>(`/animais/${id}`, data).then((r) => r.data),

  deletar: (id: string) =>
    client.delete<ApiResponse<null>>(`/animais/${id}`).then((r) => r.data),

  listarRacas: (signal?: AbortSignal) =>
    client.get<ApiResponse<string[]>>("/animais/racas", { ...(signal ? { signal } : {}) }).then((r) => r.data),
};
