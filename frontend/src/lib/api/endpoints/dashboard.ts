import client from "../client";
import type { DashboardKPI, GraficoReprodutivoData, TimelineItem, ApiResponse } from "@/types";

export const dashboardApi = {
  kpis: (fazendaId?: string, signal?: AbortSignal) =>
    client
      .get<ApiResponse<DashboardKPI>>("/dashboard/kpis", {
        params: fazendaId ? { fazenda_id: fazendaId } : {},
        ...(signal ? { signal } : {}),
      })
      .then((r) => r.data),

  grafico: (fazendaId?: string, meses?: number, signal?: AbortSignal) =>
    client
      .get<ApiResponse<GraficoReprodutivoData>>("/dashboard/grafico-reprodutivo", {
        params: {
          ...(fazendaId ? { fazenda_id: fazendaId } : {}),
          ...(meses ? { meses } : {}),
        },
        ...(signal ? { signal } : {}),
      })
      .then((r) => r.data),

  timeline: (signal?: AbortSignal) =>
    client.get<ApiResponse<TimelineItem[]>>("/dashboard/timeline", { ...(signal ? { signal } : {}) }).then((r) => r.data),
};
