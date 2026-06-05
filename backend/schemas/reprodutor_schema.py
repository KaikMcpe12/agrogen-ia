from datetime import datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, Field, model_validator, ConfigDict
from typing import Optional

from models.enums import EspecieAnimal, TipoReprodutor


class ReproductorBase(BaseModel):
    nome:             str                      = Field(..., min_length=1, max_length=120)
    registro:         Optional[str]            = Field(None, max_length=60)
    especie:          EspecieAnimal
    raca:             str                      = Field(..., min_length=1, max_length=80)
    tipo:             TipoReprodutor
    animal_id:        Optional[UUID]           = None
    empresa_semen:    Optional[str]            = Field(None, max_length=120)
    dep_peso_desmame: Optional[Decimal]        = Field(None)
    dep_fertilidade:  Optional[Decimal]        = Field(None)
    dep_acuracia:     Optional[Decimal]        = Field(None, ge=0, le=1)

    @model_validator(mode="after")
    def validar_tipo(self) -> "ReproductorBase":
        if self.tipo == TipoReprodutor.ANIMAL_PROPRIO and self.animal_id is None:
            raise ValueError("animal_id é obrigatório quando tipo=ANIMAL_PROPRIO.")
        if self.tipo == TipoReprodutor.SEMEN_EXTERNO and self.animal_id is not None:
            raise ValueError("animal_id deve ser omitido quando tipo=SEMEN_EXTERNO.")
        return self


class ReproductorCreate(ReproductorBase):
    pass


class ReproductorUpdate(BaseModel):
    nome:             Optional[str]            = Field(None, min_length=1, max_length=120)
    registro:         Optional[str]            = Field(None, max_length=60)
    raca:             Optional[str]            = Field(None, min_length=1, max_length=80)
    empresa_semen:    Optional[str]            = Field(None, max_length=120)
    dep_peso_desmame: Optional[Decimal]        = None
    dep_fertilidade:  Optional[Decimal]        = None
    dep_acuracia:     Optional[Decimal]        = Field(None, ge=0, le=1)


class ReproductorResponse(ReproductorBase):
    reprodutor_id: UUID
    ativo:         bool
    created_at:    datetime

    model_config = ConfigDict(from_attributes=True)
