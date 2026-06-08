import client from "../client";
import type { Animal, Inseminacao, Pesagem, Parto, PaginatedResponse, ApiResponse, Especie, Sexo, StatusAnimal } from "@/types";

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
  listar: (params?: AnimaisParams, signal?: AbortSignal) =>
    client.get<PaginatedResponse<Animal>>("/animais", { params, ...(signal ? { signal } : {}) }).then((r) => r.data),

  buscar: (id: string, signal?: AbortSignal) =>
    client.get<ApiResponse<Animal>>(`/animais/${id}`, { ...(signal ? { signal } : {}) }).then((r) => r.data),

  historico: (id: string, params?: { limit?: number }, signal?: AbortSignal) =>
    client.get<ApiResponse<{
      inseminacoes: Pick<Inseminacao, "id" | "data_inseminacao" | "tipo" | "resultado">[];
      pesagens: Pick<Pesagem, "id" | "data" | "peso_kg" | "gmd_calculado">[];
      partos: Pick<Parto, "id" | "data_parto" | "num_crias" | "num_crias_vivas">[];
    }>>(`/animais/${id}/historico`, { params, ...(signal ? { signal } : {}) }).then((r) => r.data),

  criar: (body: Partial<Animal>) =>
    client.post<ApiResponse<Pick<Animal, "id" | "codigo" | "nome" | "status" | "created_at">>>("/animais", body).then((r) => r.data),

  atualizar: (id: string, data: Partial<Animal>) =>
    client.put<ApiResponse<Animal>>(`/animais/${id}`, data).then((r) => r.data),

  deletar: (id: string) =>
    client.delete<ApiResponse<null>>(`/animais/${id}`).then((r) => r.data),

  listarRacas: (params?: { especie?: "BOVINO" | "OVINO" | "CAPRINO" }, signal?: AbortSignal) =>
    client.get<ApiResponse<Record<string, string[]>>>("/animais/racas", { params, ...(signal ? { signal } : {}) }).then((r) => r.data),

  importarCsv: (arquivo: File, fazendaId: string) => {
    const form = new FormData();
    form.append("arquivo", arquivo);
    form.append("fazenda_id", fazendaId);
    return client.post<ApiResponse<{
      total_linhas: number;
      importados: number;
      erros: number;
      detalhes_erros: { linha: number; erro: string }[];
    }>>("/animais/importar-csv", form, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
  },
};
