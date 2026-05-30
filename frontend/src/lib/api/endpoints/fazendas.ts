import client from "../client";
import type { Fazenda, ApiResponse } from "@/types";

export const fazendasApi = {
  listar: () =>
    client.get<ApiResponse<Fazenda[]>>("/fazendas").then((r) => r.data),

  criar: (body: Partial<Fazenda>) =>
    client.post<ApiResponse<Fazenda>>("/fazendas", body).then((r) => r.data),

  atualizar: (id: string, body: Partial<Fazenda>) =>
    client.put<ApiResponse<Fazenda>>(`/fazendas/${id}`, body).then((r) => r.data),

  deletar: (id: string) =>
    client.delete<ApiResponse<null>>(`/fazendas/${id}`).then((r) => r.data),
};
