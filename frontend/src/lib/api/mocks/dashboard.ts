import type { DashboardKPI, GraficoReprodutivoData, TimelineItem } from "@/types";

export const dashboardKPIs: DashboardKPI = {
  total_animais: {
    total: 15,
    por_especie: { bovino: 8, ovino: 4, caprino: 3 },
  },
  inseminacoes_mes: { total: 4, delta_pct: 33, sentido: "positivo" },
  taxa_prenhez: {
    valor: 5,
    percentual: 71,
    badge: "POSITIVO",
    periodo: "Últimos 6 meses",
  },
  alertas_ativos: { total: 4, criticos: 1, altos: 2 },
  calculado_em: new Date().toISOString(),
};

export const graficoReproductivo: GraficoReprodutivoData = {
  labels: ["Dez/25", "Jan/26", "Fev/26", "Mar/26", "Abr/26", "Mai/26"],
  inseminacoes: [3, 2, 5, 4, 3, 4],
  taxa_prenhez: [0.67, 0.50, 0.80, 0.75, 0.67, 0],
  periodo: { inicio: "2025-12-01", fim: "2026-05-31" },
};

export const timeline: TimelineItem[] = [
  { tipo: "INSEMINACAO", animal_id: "ani-015", animal_codigo: "CAP-0015", animal_nome: "Rosinha", usuario_nome: "Maria Campos", descricao: "Nova inseminação (IA Convencional)", data: "2026-05-01T09:00:00Z", data_relativa: "há 36 dias" },
  { tipo: "INSEMINACAO", animal_id: "ani-009", animal_codigo: "OVI-0012", animal_nome: "Neve", usuario_nome: "Maria Campos", descricao: "Nova inseminação (IA Convencional)", data: "2026-04-30T08:00:00Z", data_relativa: "há 37 dias" },
  { tipo: "INSEMINACAO", animal_id: "ani-002", animal_codigo: "BOV-0012", animal_nome: "Mimosa", usuario_nome: "Maria Campos", descricao: "Nova inseminação IATF — Protocolo P4+EB", data: "2026-04-28T09:00:00Z", data_relativa: "há 39 dias" },
  { tipo: "PESAGEM", animal_id: "ani-008", animal_codigo: "OVI-0007", animal_nome: "Branca", usuario_nome: "Maria Campos", descricao: "Pesagem registrada: 34,8 kg", data: "2026-05-15T08:00:00Z", data_relativa: "há 22 dias" },
  { tipo: "DIAGNOSTICO", animal_id: "ani-005", animal_codigo: "BOV-0041", animal_nome: "Princesa", usuario_nome: "Maria Campos", descricao: "Diagnóstico: PRENHA. Parto previsto 20/11/2026", data: "2026-03-15T10:00:00Z", data_relativa: "há 83 dias" },
  { tipo: "DIAGNOSTICO", animal_id: "ani-007", animal_codigo: "OVI-0001", animal_nome: "Serena", usuario_nome: "Maria Campos", descricao: "Diagnóstico: PRENHA. Parto previsto 21/07/2026", data: "2026-03-09T11:00:00Z", data_relativa: "há 89 dias" },
  { tipo: "PARTO", animal_id: "ani-003", animal_codigo: "BOV-0021", animal_nome: "Boneca", usuario_nome: "Maria Campos", descricao: "Parto simples registrado. 1 cria viva.", data: "2025-06-20T07:00:00Z", data_relativa: "há 352 dias" },
  { tipo: "ALERTA", animal_id: "ani-002", animal_codigo: "BOV-0012", animal_nome: "Mimosa", descricao: "Alerta crítico: diagnóstico pendente há 31 dias", data: "2026-05-26T06:00:00Z", data_relativa: "há 12 dias" },
];
