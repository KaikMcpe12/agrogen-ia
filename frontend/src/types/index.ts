/* ── Enums ─────────────────────────────────────────────────────── */

export type Especie = "BOVINO" | "OVINO" | "CAPRINO";
export type Sexo = "MACHO" | "FEMEA";
export type StatusAnimal =
  | "ATIVA"
  | "PRENHA"
  | "EM_REPOUSO"
  | "DESCARTADA"
  | "REPRODUTOR_ATIVO"
  | "EM_MONITORAMENTO";
export type Perfil = "ADMIN" | "PRODUTOR" | "TECNICO" | "VETERINARIO";
export type ResultadoInseminacao = "PENDENTE" | "PRENHA" | "VAZIA" | "CANCELADA";
export type TipoInseminacao = "IA_CONVENCIONAL" | "IATF" | "TE";
export type TipoReprodutor = "SEMEN_EXTERNO" | "ANIMAL_PROPRIO";
export type TipoSanitario = "VACINA" | "VERMIFUGACAO" | "MEDICACAO" | "EXAME";
export type ViaSanitaria = "IM" | "IV" | "VO" | "SC" | "TOPICA" | "ORAL";
export type CategoriaOcorrencia = "SAUDE" | "MANEJO" | "COMPORTAMENTO" | "OUTRO";
export type TipoParto = "SIMPLES" | "DUPLO" | "MULTIPLO";
export type EstagioPesagem = "NASCIMENTO" | "DESMAME" | "CRESCIMENTO" | "ADULTO" | "ABATE";
export type MetodoDiagnostico = "PALPACAO_RETAL" | "ULTRASSONOGRAFIA" | "EXAME_LABORATORIAL";
export type TipoAlerta =
  | "DIAGNOSTICO_PENDENTE"
  | "VACINA_PROXIMA"
  | "INTERVALO_CURTO"
  | "GESTACAO_CONFIRMADA";
export type PrioridadeAlerta = "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
export type UrgenciaInseminacao = "CRITICA" | "NORMAL";
export type ClassificacaoPrenhez = "FAVORAVEL" | "DESFAVORAVEL";
export type SentidoImpacto = "POSITIVO" | "NEGATIVO";
export type TipoProducao = "CORTE" | "LEITE" | "MISTA" | "OUTRO";
export type TipoEvento = "INSEMINACAO" | "DIAGNOSTICO" | "PARTO" | "PESAGEM";

/* ── Pagination ──────────────────────────────────────────────── */

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

/* ── Entities ────────────────────────────────────────────────── */

export interface DadosGeneticos {
  raca_principal: string;
  raca_pai?: string | undefined;
  raca_mae?: string | undefined;
  pai_id?: string | undefined;
  mae_id?: string | undefined;
  dep_peso_desmame?: number | undefined;
  dep_fertilidade?: number | undefined;
  dep_acuracia?: number | undefined;
  coeficiente_endogamia?: number | undefined;
}

export interface UltimoEvento {
  tipo: TipoEvento;
  resultado?: ResultadoInseminacao;
  data: string;
}

export interface Animal {
  id: string;
  codigo: string;
  nome: string;
  especie: Especie;
  raca_principal: string;
  sexo: Sexo;
  status: StatusAnimal;
  data_nascimento: string;
  idade_meses: number;
  peso_inicial_kg: number;
  condicao_corporal: number;
  num_partos: number;
  data_ultimo_parto?: string;
  dados_geneticos?: DadosGeneticos;
  fazenda_id: string;
  ultimo_evento?: UltimoEvento;
  created_at: string;
  updated_at?: string;
}

export interface Fazenda {
  id: string;
  nome: string;
  municipio: string;
  estado: string;
  area_hectares?: number;
  tipo_producao?: TipoProducao;
  capacidade_rebanho?: number;
  total_animais: number;
  created_at: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  cpf?: string;
  telefone?: string;
  perfil: Perfil;
  ultimo_acesso?: string;
  fazendas: Pick<Fazenda, "id" | "nome" | "municipio" | "estado">[];
  created_at: string;
}

export interface Reprodutor {
  id: string;
  nome: string;
  especie: Especie;
  raca: string;
  tipo: TipoReprodutor;
  empresa_semen?: string;
  dep_peso_desmame?: number;
  dep_acuracia?: number;
}

export interface DiagnosticoInseminacao {
  data_diagnostico: string;
  metodo: MetodoDiagnostico;
  resultado: "PRENHA" | "VAZIA" | "INCONCLUSIVO";
  data_parto_prevista?: string;
  veterinario_id?: string;
  observacoes?: string;
}

export interface Inseminacao {
  id: string;
  animal: Pick<Animal, "id" | "codigo" | "nome">;
  reprodutor: Pick<Reprodutor, "id" | "nome" | "raca" | "tipo">;
  tecnico?: { id: string; nome: string };
  data_inseminacao: string;
  tipo: TipoInseminacao;
  protocolo_descricao?: string;
  condicao_corporal_momento: number;
  dias_pos_parto?: number;
  temperatura_ambiente_c?: number;
  observacoes?: string;
  resultado: ResultadoInseminacao;
  dias_decorridos: number;
  urgencia: UrgenciaInseminacao;
  diagnostico?: DiagnosticoInseminacao;
  data_esperada_diagnostico?: string;
  created_at: string;
  updated_at?: string;
}

export interface Alerta {
  id: string;
  tipo: TipoAlerta;
  prioridade: PrioridadeAlerta;
  lido: boolean;
  resolvido: boolean;
  mensagem: string;
  data_disparo: string;
  animal: Pick<Animal, "id" | "codigo" | "nome">;
  created_at: string;
}

/* ── Diário ──────────────────────────────────────────────────── */

export interface Pesagem {
  id: string;
  animal_id: string;
  data: string;
  peso_kg: number;
  estagio: EstagioPesagem;
  gmd_calculado?: number;
  observacao?: string;
  created_at: string;
}

export interface Parto {
  id: string;
  animal_id: string;
  data_parto: string;
  tipo_parto: TipoParto;
  num_crias: number;
  num_crias_vivas: number;
  peso_total_crias_kg?: number;
  houve_distorcia: boolean;
  houve_obito_matriz: boolean;
  inseminacao_id?: string;
  created_at: string;
}

export interface EventoSanitario {
  id: string;
  animal_id: string;
  tipo: TipoSanitario;
  produto: string;
  principio_ativo?: string;
  data_aplicacao: string;
  dose?: string;
  via?: ViaSanitaria;
  lote_produto?: string;
  proxima_dose?: string;
  alerta_criado?: { id: string; data_disparo: string };
  created_at: string;
}

export interface Ocorrencia {
  id: string;
  animal_id: string;
  data: string;
  categoria: CategoriaOcorrencia;
  titulo: string;
  descricao: string;
  resolvida: boolean;
  created_at: string;
}

export interface ResumoPesagens {
  ultima_pesagem_kg?: number;
  gmd_periodo?: number;
  total_registros: number;
}

/* ── Dashboard ───────────────────────────────────────────────── */

export interface DashboardKPI {
  total_animais: {
    total: number;
    por_especie: { bovino: number; ovino: number; caprino: number };
  };
  inseminacoes_mes: { total: number; delta_pct: number; sentido: "up" | "down" };
  taxa_prenhez: { valor: number; percentual: number; badge: "ok" | "warn" | "danger"; periodo: string };
  alertas_ativos: { total: number; criticos: number; altos: number };
  calculado_em: string;
}

export interface GraficoPonto {
  mes: string;
  inseminacoes: number;
  taxa_prenhez: number;
}

export interface TimelineItem {
  id: string;
  tipo: TipoEvento | "ALERTA";
  animal: Pick<Animal, "id" | "codigo" | "nome">;
  usuario?: string;
  descricao: string;
  data: string;
}

/* ── IA ──────────────────────────────────────────────────────── */

export interface FatorDeterminante {
  feature: string;
  label: string;
  impacto: number;
  sentido: SentidoImpacto;
  valor_atual: number;
}

export interface PredicaoPrenhez {
  animal_id: string;
  score_prenhez: number;
  score_percentual: number;
  classificacao: ClassificacaoPrenhez;
  fatores_determinantes: FatorDeterminante[];
  recomendacoes: string[];
  aviso_clinico?: string;
  modelo_versao: string;
  processado_em_ms: number;
}

export interface PadroesFertilidade {
  por_mes: { mes: string; inseminacoes: number; prenhez: number; taxa: number }[];
  por_raca: { raca: string; inseminacoes: number; taxa: number }[];
  por_tecnico: { tecnico_nome: string; inseminacoes: number; taxa: number }[];
  por_protocolo: { protocolo: string; inseminacoes: number; taxa: number }[];
  minimo_inseminacoes_atingido: boolean;
}

/* ── Auth ────────────────────────────────────────────────────── */

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface LoginResponse extends AuthTokens {
  usuario: Pick<Usuario, "id" | "nome" | "email" | "perfil"> & { fazenda_ativa_id?: string };
}
