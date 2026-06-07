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
  listar: (params?: AlertasParams, signal?: AbortSignal) =>
    client.get<AlertasResponse>("/alertas", { params, ...(signal ? { signal } : {}) }).then((r) => r.data),

  contagem: (signal?: AbortSignal) =>
    client.get<AlertasContagemResponse>("/alertas/contagem", { ...(signal ? { signal } : {}) }).then((r) => r.data),

  marcarLido: (id: string) =>
    client.patch<ApiResponse<{ id: string; lido: boolean }>>(`/alertas/${id}/lido`, { lido: true }).then((r) => r.data),

  resolver: (id: string) =>
    client.patch<ApiResponse<{ id: string; resolvido: boolean; lido: boolean }>>(`/alertas/${id}/resolver`, { resolvido: true }).then((r) => r.data),
};
