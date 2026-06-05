from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional

from models.enums import CategoriaOcorrencia, GravidadeOcorrencia


class OcorrenciaCreate(BaseModel):
    data:       date
    categoria:  CategoriaOcorrencia
    titulo:     str                          = Field(..., min_length=1, max_length=150)
    descricao:  str                          = Field(..., min_length=1)
    gravidade:  Optional[GravidadeOcorrencia] = None
    observacoes: Optional[str]               = None

    @field_validator("data")
    @classmethod
    def nao_futura(cls, v: date) -> date:
        if v > date.today():
            raise ValueError("A data da ocorrência não pode ser futura.")
        return v


class OcorrenciaUpdate(BaseModel):
    resolvida:   Optional[bool] = None
    descricao:   Optional[str]  = None
    observacoes: Optional[str]  = None


class OcorrenciaResponse(BaseModel):
    id:            UUID = Field(..., validation_alias="ocorrencia_id")
    animal_id:     UUID
    data:          date
    categoria:     CategoriaOcorrencia
    titulo:        str
    descricao:     str
    gravidade:     Optional[GravidadeOcorrencia]
    resolvida:     bool
    created_at:    datetime
    alerta_criado: Optional[dict] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
