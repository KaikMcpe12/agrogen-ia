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

