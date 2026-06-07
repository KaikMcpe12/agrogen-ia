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

export interface RelatorioPonderalRow {
  animal_codigo: string;
  nome: string;
  ultima_pesagem_kg: number;
  gmd_periodo: number;
  num_pesagens: number;
}

export interface RelatorioSanitarioRow {
  animal_codigo: string;
  tipo: string;
  produto: string;
  data_aplicacao: string;
  proxima_dose?: string;
  responsavel: string;
}

export interface RelatorioParams {
  fazenda_id?: string | undefined;
  data_inicio?: string | undefined;
  data_fim?: string | undefined;
  especie?: string | undefined;
  tecnico_id?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

export interface RelatorioPonderalParams {
  fazenda_id?: string | undefined;
  especie?: string | undefined;
  data_inicio?: string | undefined;
  data_fim?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

export interface RelatorioSanitarioParams {
  fazenda_id?: string | undefined;
  tipo?: string | undefined;
  data_inicio?: string | undefined;
  data_fim?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

export const relatoriosApi = {
  reprodutivo: (params?: RelatorioParams, signal?: AbortSignal) =>
    client
      .get<PaginatedResponse<RelatorioReprodutivoRow> & { success: boolean; indices?: { taxa_prenhez: number; num_servicos_concepcao: number; total_inseminacoes: number; total_prenhes: number } }>("/relatorios/reprodutivo", {
        params,
        ...(signal ? { signal } : {}),
      })
      .then((r) => r.data),

  ponderal: (params?: RelatorioPonderalParams, signal?: AbortSignal) =>
    client
      .get<PaginatedResponse<RelatorioPonderalRow> & { success: boolean }>("/relatorios/ponderal", {
        params,
        ...(signal ? { signal } : {}),
      })
      .then((r) => r.data),

  sanitario: (params?: RelatorioSanitarioParams, signal?: AbortSignal) =>
    client
      .get<PaginatedResponse<RelatorioSanitarioRow> & { success: boolean }>("/relatorios/sanitario", {
        params,
        ...(signal ? { signal } : {}),
      })
      .then((r) => r.data),
};
