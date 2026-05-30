import client from "../client";
import type { Alerta, ApiResponse, PrioridadeAlerta } from "@/types";

export interface AlertasParams {
  fazenda_id?: string;
  lido?: boolean;
  resolvido?: boolean;
  prioridade?: PrioridadeAlerta;
  page?: number;
  limit?: number;
}

export interface AlertasResponse {
  success: boolean;
  data: Alerta[];
  meta: { total: number; nao_lidos: number; criticos: number };
}

export interface AlertasContagemResponse {
  success: boolean;
  data: { nao_lidos: number; criticos: number; total: number };
}

export const alertasApi = {
  listar: (params?: AlertasParams) =>
    client.get<AlertasResponse>("/alertas", { params }).then((r) => r.data),

  contagem: () =>
    client.get<AlertasContagemResponse>("/alertas/contagem").then((r) => r.data),

  marcarLido: (id: string) =>
    client.patch<ApiResponse<null>>(`/alertas/${id}/lido`).then((r) => r.data),

  resolver: (id: string) =>
    client.patch<ApiResponse<null>>(`/alertas/${id}/resolver`).then((r) => r.data),
};
