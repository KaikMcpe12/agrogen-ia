from datetime import date, datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional

from models.enums import EstagioPesagem


class PesagemCreate(BaseModel):
    data:       date
    peso_kg:    Decimal = Field(..., gt=0, max_digits=6, decimal_places=2)
    estagio:    EstagioPesagem
    observacao: Optional[str] = Field(None, max_length=255)

    @field_validator("data")
    @classmethod
    def nao_futura(cls, v: date) -> date:
        if v > date.today():
            raise ValueError("A data da pesagem não pode ser futura.")
        return v


class PesagemResponse(BaseModel):
    id:            UUID = Field(..., validation_alias="pesagem_id")
    animal_id:     UUID
    data:          date
    peso_kg:       Decimal
    estagio:       EstagioPesagem
    gmd_calculado: Optional[Decimal]
    observacao:    Optional[str]
    created_at:    datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
