import client from "../client";
import type { DashboardKPI, GraficoPonto, TimelineItem, ApiResponse } from "@/types";

export const dashboardApi = {
  kpis: (fazendaId?: string) =>
    client.get<ApiResponse<DashboardKPI>>("/dashboard/kpis", { params: fazendaId ? { fazenda_id: fazendaId } : {} }).then((r) => r.data),

  grafico: (fazendaId?: string, meses?: number) =>
    client.get<ApiResponse<GraficoPonto[]>>("/dashboard/grafico-reprodutivo", {
      params: { ...(fazendaId ? { fazenda_id: fazendaId } : {}), ...(meses ? { meses } : {}) },
    }).then((r) => r.data),

  timeline: () =>
    client.get<ApiResponse<TimelineItem[]>>("/dashboard/timeline").then((r) => r.data),
};
