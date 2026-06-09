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
  alertas_ativos: { total: 4, criticos: 1, altas: 2 },
  calculado_em: new Date().toISOString(),
};

export const graficoReproductivo: GraficoReprodutivoData[] = [
  { mes: "Dez/25", inseminacoes: 3, taxa_prenhez: 67 },
  { mes: "Jan/26", inseminacoes: 2, taxa_prenhez: 50 },
  { mes: "Fev/26", inseminacoes: 5, taxa_prenhez: 80 },
  { mes: "Mar/26", inseminacoes: 4, taxa_prenhez: 75 },
  { mes: "Abr/26", inseminacoes: 3, taxa_prenhez: 67 },
  { mes: "Mai/26", inseminacoes: 4, taxa_prenhez: 0 },
];

export const timeline: TimelineItem[] = [
  { id: "tl-1", tipo: "INSEMINACAO", animal: { id: "ani-015", codigo: "CAP-0015", nome: "Rosinha" }, usuario: "Maria Campos", descricao: "Nova inseminação (IA Convencional)", data: "2026-05-01T09:00:00Z" },
  { id: "tl-2", tipo: "INSEMINACAO", animal: { id: "ani-009", codigo: "OVI-0012", nome: "Neve" }, usuario: "Maria Campos", descricao: "Nova inseminação (IA Convencional)", data: "2026-04-30T08:00:00Z" },
  { id: "tl-3", tipo: "INSEMINACAO", animal: { id: "ani-002", codigo: "BOV-0012", nome: "Mimosa" }, usuario: "Maria Campos", descricao: "Nova inseminação IATF — Protocolo P4+EB", data: "2026-04-28T09:00:00Z" },
  { id: "tl-4", tipo: "PESAGEM", animal: { id: "ani-008", codigo: "OVI-0007", nome: "Branca" }, usuario: "Maria Campos", descricao: "Pesagem registrada: 34,8 kg", data: "2026-05-15T08:00:00Z" },
  { id: "tl-5", tipo: "DIAGNOSTICO", animal: { id: "ani-005", codigo: "BOV-0041", nome: "Princesa" }, usuario: "Maria Campos", descricao: "Diagnóstico: PRENHA. Parto previsto 20/11/2026", data: "2026-03-15T10:00:00Z" },
  { id: "tl-6", tipo: "DIAGNOSTICO", animal: { id: "ani-007", codigo: "OVI-0001", nome: "Serena" }, usuario: "Maria Campos", descricao: "Diagnóstico: PRENHA. Parto previsto 21/07/2026", data: "2026-03-09T11:00:00Z" },
  { id: "tl-7", tipo: "PARTO", animal: { id: "ani-003", codigo: "BOV-0021", nome: "Boneca" }, usuario: "Maria Campos", descricao: "Parto simples registrado. 1 cria viva.", data: "2025-06-20T07:00:00Z" },
  { id: "tl-8", tipo: "ALERTA", animal: { id: "ani-002", codigo: "BOV-0012", nome: "Mimosa" }, descricao: "Alerta crítico: diagnóstico pendente há 31 dias", data: "2026-05-26T06:00:00Z" },
];
