from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

from models.enums import TipoAlerta, PrioridadeAlerta


class AlertaResponse(BaseModel):
    id:             UUID = Field(..., validation_alias="alerta_id")
    animal_id:      Optional[UUID]
    inseminacao_id: Optional[UUID]
    sanitario_id:   Optional[UUID]
    tipo:           TipoAlerta
    mensagem:       str
    data_disparo:   date
    prioridade:     PrioridadeAlerta
    lido:           bool
    resolvido:      bool
    created_at:     datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class AlertaBadgeResponse(BaseModel):
    total_nao_lidos: int
    criticos:        int
    altas:           int


class AlertaResolverRequest(BaseModel):
    resolvido: bool = True
