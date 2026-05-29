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
