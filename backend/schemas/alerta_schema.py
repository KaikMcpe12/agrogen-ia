from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from typing import Optional

from models.enums import TipoAlerta, PrioridadeAlerta


class AlertaResponse(BaseModel):
    alerta_id:      UUID
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

    model_config = ConfigDict(from_attributes=True)


class AlertaBadgeResponse(BaseModel):
    total_nao_lidos: int
    criticos:        int
    altas:           int
