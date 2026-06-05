import client from "../client";
import type { PaginatedResponse } from "@/types";

export interface RelatorioReprodutivoRow {
  animal_codigo: string;
  animal_nome: string;
  data_inseminacao: string;
  tipo_ia: string;
  reprodutor: string;
  resultado: string;
  tecnico: string;
}

export interface RelatorioParams {
  fazenda_id?: string | undefined;
  data_inicio?: string | undefined;
  data_fim?: string | undefined;
  especie?: string | undefined;
  status?: string | undefined;
  tecnico?: string | undefined;
}

export const relatoriosApi = {
  reprodutivo: (params?: RelatorioParams, signal?: AbortSignal) =>
    client
      .get<PaginatedResponse<RelatorioReprodutivoRow> & { success: boolean }>("/relatorios/reprodutivo", {
        params,
        ...(signal ? { signal } : {}),
      })
      .then((r) => r.data),

  exportar: (tipo: "reprodutivo" | "ponderal" | "sanitario", formato: "pdf" | "csv") =>
    client.get(`/relatorios/${tipo}/exportar`, { params: { formato }, responseType: "blob" }).then((r) => r.data),
};
