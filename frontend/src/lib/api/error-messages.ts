const messages: Record<string, string> = {
  // Autenticação
  AUTH_INVALID_CREDENTIALS: "E-mail ou senha incorretos. Verifique e tente novamente.",
  AUTH_ACCOUNT_LOCKED: "Conta bloqueada temporariamente por excesso de tentativas. Tente em 15 minutos.",
  REFRESH_TOKEN_INVALID: "Sessão expirada. Faça login novamente.",
  TOKEN_EXPIRED: "Sessão expirada. Faça login novamente.",
  UNAUTHORIZED: "Você precisa estar autenticado para acessar este recurso.",

  // Cadastro de usuário
  EMAIL_ALREADY_EXISTS: "Este e-mail já está cadastrado no sistema.",
  CPF_ALREADY_EXISTS: "Este CPF já está vinculado a outra conta.",

  // Animais
  ANIMAL_NOT_FOUND: "Animal não encontrado ou não pertence a esta fazenda.",
  INVALID_PESO: "Peso fora da faixa válida para a espécie.",
  INVALID_DATE: "Data de nascimento não pode ser futura.",
  BRINCO_DUPLICADO: "Este brinco/tatuagem já está cadastrado nesta fazenda.",
  INVALID_FILTER: "Filtro inválido. Verifique os valores informados.",
  INVALID_STATUS_TRANSITION: "Transição de status inválida para o estado atual do animal.",

  // Inseminação
  INTERVALO_CURTO: "Intervalo entre inseminações abaixo do mínimo recomendado.",
  STATUS_INCOMPATIVEL: "Animal com status incompatível para inseminação.",
  ESPECIE_INCOMPATIVEL: "A espécie do reprodutor não corresponde à do animal.",
  DIAGNOSTICO_JA_EXISTE: "Esta inseminação já possui diagnóstico registrado.",
  DATA_ANTERIOR_INSEMINACAO: "A data do diagnóstico deve ser posterior à data da inseminação.",

  // Diário de Bordo
  PESO_FORA_FAIXA: "Peso fora do intervalo válido para a espécie.",
  ANIMAL_MACHO: "O controle de parição está disponível apenas para fêmeas.",

  // IA
  HISTORICO_INSUFICIENTE: "Animal sem histórico suficiente. São necessárias ao menos 1 inseminação.",
  IA_SERVICE_UNAVAILABLE: "Serviço de IA temporariamente indisponível. Um modelo de regras alternativo foi ativado.",
  DADOS_INSUFICIENTES: "São necessárias ao menos 20 inseminações com diagnóstico para análise de padrões.",

  // Relatórios
  FORMATO_INVALIDO: "Formato de exportação inválido. Use PDF ou CSV.",
  SEM_DADOS: "Nenhum dado encontrado para os filtros aplicados.",

  // CSV
  INVALID_CSV_FORMAT: "O arquivo CSV não corresponde ao template esperado.",

  // Fazendas
  FAZENDA_NOT_FOUND: "Fazenda não encontrada.",
  FORBIDDEN: "Você não tem permissão para realizar esta operação.",

  // Genérico
  VALIDATION_ERROR: "Dados inválidos. Verifique os campos e tente novamente.",
  NETWORK_ERROR: "Falha de conexão. Verifique sua internet e tente novamente.",
  UNKNOWN_ERROR: "Ocorreu um erro inesperado. Tente novamente.",
};

export function getErrorMessage(code: string | undefined): string {
  if (!code) return messages["UNKNOWN_ERROR"]!;
  return messages[code] ?? messages["UNKNOWN_ERROR"]!;
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
