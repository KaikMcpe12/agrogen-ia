from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict
from typing import Optional

from models.enums import TipoSanitario, ViaAdministracao


class EventoSanitarioCreate(BaseModel):
    tipo:              TipoSanitario
    produto:           str                          = Field(..., min_length=1, max_length=120)
    principio_ativo:   Optional[str]                = Field(None, max_length=120)
    data_aplicacao:    date
    dose:              Optional[str]                = Field(None, max_length=60)
    via_administracao: Optional[ViaAdministracao]   = None
    lote_produto:      Optional[str]                = Field(None, max_length=60)
    proxima_dose:      Optional[date]               = None
    responsavel_id:    UUID
    observacoes:       Optional[str]                = None

    @field_validator("data_aplicacao")
    @classmethod
    def nao_futura(cls, v: date) -> date:
        if v > date.today():
            raise ValueError("A data de aplicação não pode ser futura.")
        return v

    @model_validator(mode="after")
    def proxima_dose_posterior(self) -> "EventoSanitarioCreate":
        if self.proxima_dose and self.proxima_dose <= self.data_aplicacao:
            raise ValueError("proxima_dose deve ser posterior à data_aplicacao.")
        return self


class EventoSanitarioResponse(BaseModel):
    id:                UUID = Field(..., validation_alias="evento_san_id")
    animal_id:         UUID
    tipo:              TipoSanitario
    produto:           str
    principio_ativo:   Optional[str]
    data_aplicacao:    date
    dose:              Optional[str]
    via_administracao: Optional[ViaAdministracao]
    lote_produto:      Optional[str]
    proxima_dose:      Optional[date]
    responsavel_id:    UUID
    observacoes:       Optional[str]
    created_at:        datetime
    alerta_criado:     Optional[dict] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
