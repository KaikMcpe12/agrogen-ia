from datetime import datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional


class PredicaoRequest(BaseModel):
    animal_id:               UUID
    condicao_corporal_atual: Optional[int]     = Field(None, ge=1, le=5)
    temperatura_ambiente_c:  Optional[Decimal] = None
    reprodutor_candidato_id: Optional[UUID]    = None
    tecnico_id:              Optional[UUID]    = None


class FatorDeterminante(BaseModel):
    feature:    str
    impacto:    float
    sentido:    str
    valor_atual: object


class PredicaoResponse(BaseModel):
    predicao_id:          UUID
    animal_id:            UUID
    score_prenhez:        float
    score_percentual:     int
    classificacao:        str
    fatores_determinantes: list[FatorDeterminante]
    recomendacoes:        list[str]
    aviso_clinico:        str
    modelo_versao:        str
    motor_utilizado:      str
    processado_em_ms:     int
    created_at:           datetime

    model_config = ConfigDict(from_attributes=True)
