import type { PredicaoPrenhez, PadroesFertilidade } from "@/types";

export const predicaoPrenhez: PredicaoPrenhez = {
  animal_id: "ani-002",
  score_prenhez: 0.74,
  score_percentual: 74,
  classificacao: "FAVORAVEL",
  fatores_determinantes: [
    { feature: "condicao_corporal", label: "Condição corporal atual", impacto: 0.12, sentido: "POSITIVO", valor_atual: 3 },
    { feature: "intervalo_pos_parto", label: "Intervalo pós-parto", impacto: 0.09, sentido: "POSITIVO", valor_atual: 48 },
    { feature: "historico_prenhez", label: "Histórico de prenhez", impacto: 0.08, sentido: "POSITIVO", valor_atual: 0.67 },
    { feature: "temperatura_ambiente", label: "Temperatura ambiente", impacto: -0.06, sentido: "NEGATIVO", valor_atual: 34 },
    { feature: "num_partos", label: "Número de partos anteriores", impacto: 0.04, sentido: "POSITIVO", valor_atual: 3 },
  ],
  recomendacoes: [
    "Momento favorável para inseminação. Priorizar reprodutor com alto DEP de fertilidade.",
    "Monitorar condição corporal — mantê-la acima de 3 para melhores resultados.",
    "Evitar estresse térmico nas 72h pré e pós-inseminação.",
  ],
  modelo_versao: "v2.1.0-random-forest",
  processado_em_ms: 342,
};

export const padroesFertilidade: PadroesFertilidade = {
  por_mes: [
    { mes: "Dez/25", inseminacoes: 3, prenhez: 2, taxa: 67 },
    { mes: "Jan/26", inseminacoes: 2, prenhez: 1, taxa: 50 },
    { mes: "Fev/26", inseminacoes: 5, prenhez: 4, taxa: 80 },
    { mes: "Mar/26", inseminacoes: 4, prenhez: 3, taxa: 75 },
    { mes: "Abr/26", inseminacoes: 3, prenhez: 0, taxa: 0 },
    { mes: "Mai/26", inseminacoes: 4, prenhez: 0, taxa: 0 },
  ],
  por_raca: [
    { raca: "Nelore", inseminacoes: 8, taxa: 75 },
    { raca: "Angus", inseminacoes: 3, taxa: 67 },
    { raca: "Dorper", inseminacoes: 4, taxa: 75 },
    { raca: "Boer", inseminacoes: 3, taxa: 67 },
  ],
  por_tecnico: [
    { tecnico_nome: "Maria Campos", inseminacoes: 18, taxa: 72 },
    { tecnico_nome: "João Silva", inseminacoes: 4, taxa: 50 },
  ],
  por_protocolo: [
    { protocolo: "IATF P4+EB", inseminacoes: 10, taxa: 80 },
    { protocolo: "IA Convencional", inseminacoes: 10, taxa: 60 },
    { protocolo: "TE", inseminacoes: 2, taxa: 100 },
  ],
  minimo_inseminacoes_atingido: true,
};
