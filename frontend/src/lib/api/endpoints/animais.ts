import client from "../client";
import type { Animal, PaginatedResponse, ApiResponse, Especie, Sexo, StatusAnimal } from "@/types";

export interface AnimaisParams {
  fazenda_id?: string;
  q?: string;
  especie?: Especie;
  sexo?: Sexo;
  status?: StatusAnimal;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export const animaisApi = {
  listar: (params?: AnimaisParams) =>
    client.get<PaginatedResponse<Animal>>("/animais", { params }).then((r) => r.data),

  buscar: (id: string) =>
    client.get<ApiResponse<Animal>>(`/animais/${id}`).then((r) => r.data),

  criar: (body: Partial<Animal>) =>
    client.post<ApiResponse<Pick<Animal, "id" | "codigo" | "nome" | "status" | "created_at">>>("/animais", body).then((r) => r.data),

  deletar: (id: string) =>
    client.delete<ApiResponse<null>>(`/animais/${id}`).then((r) => r.data),

  listarRacas: () =>
    client.get<ApiResponse<string[]>>("/animais/racas").then((r) => r.data),
};
