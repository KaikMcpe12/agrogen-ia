// Mensagens estáticas — exibidas como-estão (Adendo UX seção 7.2)
const staticMessages: Record<string, string> = {
  // Autenticação
  AUTH_INVALID_CREDENTIALS: "E-mail ou senha incorretos. Tente novamente.",
  AUTH_ACCOUNT_LOCKED: "Sua conta foi temporariamente bloqueada. Tente em alguns minutos.",
  REFRESH_TOKEN_INVALID: "Sessão expirada. Faça login novamente.",
  TOKEN_EXPIRED: "Sessão expirada. Faça login novamente.",
  UNAUTHORIZED: "Você precisa estar autenticado para acessar este recurso.",

  // Cadastro
  EMAIL_ALREADY_EXISTS: "Este e-mail já está cadastrado. Faça login ou recupere sua senha.",
  CPF_ALREADY_EXISTS: "Este CPF já está vinculado a outra conta.",

  // Animais
  ANIMAL_NOT_FOUND: "Animal não encontrado ou pertence a outra fazenda.",
  INVALID_PESO: "Peso fora da faixa válida para a espécie.",
  INVALID_DATE: "Data inválida.",
  BRINCO_DUPLICADO: "Este brinco já está cadastrado em outro animal desta fazenda.",
  INVALID_FILTER: "Filtro inválido. Verifique os valores informados.",
  INVALID_STATUS_TRANSITION: "Transição de status inválida para o estado atual do animal.",

  // Inseminação
  ESPECIE_INCOMPATIVEL: "A espécie do reprodutor não corresponde à do animal.",
  DIAGNOSTICO_JA_EXISTE: "Esta inseminação já tem diagnóstico registrado.",
  DATA_ANTERIOR_INSEMINACAO: "A data do diagnóstico deve ser posterior à da inseminação.",

  // Diário de Bordo
  PESO_FORA_FAIXA: "Peso fora da faixa válida para a espécie.",
  ANIMAL_MACHO: "Esta aba é exclusiva para fêmeas reprodutoras.",

  // IA
  HISTORICO_INSUFICIENTE: "A IA precisa de pelo menos uma inseminação anterior deste animal para fazer a predição.",
  IA_SERVICE_UNAVAILABLE: "A análise por IA está temporariamente indisponível. Usando análise baseada em regras.",
  DADOS_INSUFICIENTES: "Você precisa de pelo menos 20 inseminações com diagnóstico para esta análise.",

  // Relatórios
  FORMATO_INVALIDO: "Formato de exportação inválido. Use PDF ou CSV.",
  SEM_DADOS: "Nenhum dado encontrado para os filtros aplicados.",

  // CSV
  INVALID_CSV_FORMAT: "O arquivo CSV não corresponde ao template esperado.",

  // Fazendas
  FAZENDA_NOT_FOUND: "Fazenda não encontrada.",

  // Reprodutores
  REPRODUTOR_TEM_VINCULOS: "Reprodutor com inseminações não pode ser excluído.",

  // Genérico
  VALIDATION_ERROR: "Há campos com erro.",
  FORBIDDEN: "Seu perfil não tem permissão para esta ação.",
  NETWORK_ERROR: "Sem conexão. Verifique sua internet.",
  INTERNAL_SERVER_ERROR: "Algo deu errado do nosso lado. Tente novamente.",
  UNKNOWN_ERROR: "Ocorreu um erro. Tente novamente.",
  DEFAULT: "Ocorreu um erro. Tente novamente.",
};

// Mensagens com interpolação — recebem dados dinâmicos (ex: {N}, {X})
const interpolatedTemplates: Record<string, string> = {
  INTERVALO_CURTO: "Atenção: este animal teve inseminação há apenas {N} dias. Deseja continuar?",
  STATUS_INCOMPATIVEL: "Animais com status {X} não podem ser inseminados.",
  FORBIDDEN: "Seu perfil ({X}) não tem permissão para esta ação.",
};

export function getInterpolatedMessage(
  code: string,
  data?: Record<string, string | number>
): string {
  const tpl = interpolatedTemplates[code];
  if (!tpl) return getErrorMessage(code);
  if (!data) return tpl.replace(/\{[^}]+\}/g, "?");
  return Object.entries(data).reduce(
    (acc, [k, v]) => acc.replace(`{${k}}`, String(v)),
    tpl
  );
}

export function getErrorMessage(code: string | undefined): string {
  if (!code) return staticMessages["UNKNOWN_ERROR"]!;
  return staticMessages[code] ?? staticMessages["UNKNOWN_ERROR"]!;
}

export function extractErrorCode(error: unknown): string | undefined {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response
  ) {
    const data = error.response.data as { error?: { codigo?: string }; codigo?: string };
    return data?.error?.codigo ?? data?.codigo;
  }
  return undefined;
}

export function getApiErrorMessage(error: unknown): string {
  return getErrorMessage(extractErrorCode(error));
}
