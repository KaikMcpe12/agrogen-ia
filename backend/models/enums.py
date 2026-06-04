from enum import Enum

class EspecieAnimal(str, Enum):
    BOVINO = "BOVINO"
    OVINO = "OVINO"
    CAPRINO = "CAPRINO"

class SexoAnimal(str, Enum):
    MACHO = "MACHO"
    FEMEA = "FEMEA"

class StatusAnimal(str, Enum):
    ATIVA = "ATIVA"
    PRENHA = "PRENHA"
    EM_REPOUSO = "EM_REPOUSO"
    DESCARTADA = "DESCARTADA"
    REPRODUTOR_ATIVO = "REPRODUTOR_ATIVO"
    EM_MONITORAMENTO = "EM_MONITORAMENTO"

class Perfil(str, Enum):
    ADMIN = "ADMIN"
    PRODUTOR = "PRODUTOR"
    TECNICO = "TECNICO"
    VETERINARIO = "VETERINARIO"

class MetodoDiagnostico(str, Enum):
    ULTRASSONOGRAFIA = "ULTRASSONOGRAFIA"
    EXAME_LABORATORIAL  = "EXAME_LABORATORIAL"
    PALPACAO_RETAL    = "PALPACAO_RETAL"

class ResultadoDiagnostico(str, Enum):
    PRENHA    = "PRENHA"
    VAZIA     = "VAZIA"
    INCONCLUSIVO = "INCONCLUSIVO"

class TipoProducao(str, Enum):
    CORTE      = "CORTE"
    LEITE      = "LEITE"
    MISTO      = "MISTO"
    SUBSISTENCIA = "SUBSISTENCIA"

class AcaoLog(str, Enum):
    CREATE       = "CREATE"
    UPDATE       = "UPDATE"
    DELETE       = "DELETE"
    LOGIN        = "LOGIN"
    LOGOUT       = "LOGOUT"
    LOGIN_FALHOU = "LOGIN_FALHOU"

class TipoReprodutor(str, Enum):
    SEMEN_EXTERNO  = "SEMEN_EXTERNO"
    ANIMAL_PROPRIO = "ANIMAL_PROPRIO"

class TipoInseminacao(str, Enum):
    IA_CONVENCIONAL      = "IA_CONVENCIONAL"
    IATF                 = "IATF"
    TRANSFERENCIA_EMBRIAO = "TRANSFERENCIA_EMBRIAO"

class ResultadoInseminacao(str, Enum):
    PENDENTE    = "PENDENTE"
    PRENHA      = "PRENHA"
    VAZIA       = "VAZIA"
    INCONCLUSIVO = "INCONCLUSIVO"
    CANCELADA   = "CANCELADA"

class TipoParto(str, Enum):
    SIMPLES  = "SIMPLES"
    DUPLO    = "DUPLO"
    MULTIPLO = "MULTIPLO"

class EstagioPesagem(str, Enum):
    NASCIMENTO  = "NASCIMENTO"
    DESMAME     = "DESMAME"
    CRESCIMENTO = "CRESCIMENTO"
    ADULTO      = "ADULTO"
    ABATE       = "ABATE"

class TipoSanitario(str, Enum):
    VACINA        = "VACINA"
    VERMIFUGACAO  = "VERMIFUGACAO"
    MEDICACAO     = "MEDICACAO"
    EXAME         = "EXAME"
    OUTRO         = "OUTRO"

class ViaAdministracao(str, Enum):
    SC     = "SC"
    IM     = "IM"
    IV     = "IV"
    ORAL   = "ORAL"
    TOPICA = "TOPICA"

class TipoAlerta(str, Enum):
    DIAGNOSTICO_PENDENTE = "DIAGNOSTICO_PENDENTE"
    PROXIMA_DOSE         = "PROXIMA_DOSE"
    JANELA_IATF          = "JANELA_IATF"
    OCORRENCIA_CRITICA   = "OCORRENCIA_CRITICA"
    OUTRO                = "OUTRO"

class PrioridadeAlerta(str, Enum):
    BAIXA  = "BAIXA"
    MEDIA  = "MEDIA"
    ALTA   = "ALTA"
    CRITICA = "CRITICA"

class TipoAlimentacao(str, Enum):
    PASTO        = "PASTO"
    CONFINAMENTO = "CONFINAMENTO"
    SUPLEMENTACAO = "SUPLEMENTACAO"
    MISTO        = "MISTO"

class CategoriaOcorrencia(str, Enum):
    SAUDE        = "SAUDE"
    MANEJO       = "MANEJO"
    COMPORTAMENTO = "COMPORTAMENTO"
    REPRODUCAO   = "REPRODUCAO"
    OUTRO        = "OUTRO"

class GravidadeOcorrencia(str, Enum):
    BAIXA  = "BAIXA"
    MEDIA  = "MEDIA"
    ALTA   = "ALTA"
    CRITICA = "CRITICA"