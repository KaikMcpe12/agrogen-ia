from datetime import datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, Field, model_validator, ConfigDict
from typing import Optional, Any


class AnaliseIABase(BaseModel):
    animal_id:          UUID
    tecnico_id:         Optional[UUID]    = None
    score_prenhez:      Optional[Decimal] = Field(None, ge=0, le=1)
    fatores_influentes: Optional[dict[str, Any]] = None
    parametros_entrada: Optional[dict[str, Any]] = None

    @model_validator(mode="after")
    def validar_regras(self) -> "AnaliseIABase":
        if self.score_prenhez is not None:
            # ge/le do Field já cobre, mas reforçamos a precisão do banco (5,4) → max 0.9999
            if not (Decimal("0") <= self.score_prenhez <= Decimal("1")):
                raise ValueError("score_prenhez deve estar entre 0 e 1.")
        return self


class AnaliseIACreate(AnaliseIABase):
    pass


class AnaliseIAUpdate(BaseModel):
    tecnico_id:         Optional[UUID]           = None
    score_prenhez:      Optional[Decimal]        = Field(None, ge=0, le=1)
    fatores_influentes: Optional[dict[str, Any]] = None
    parametros_entrada: Optional[dict[str, Any]] = None

    @model_validator(mode="after")
    def validar_regras(self) -> "AnaliseIAUpdate":
        if self.score_prenhez is not None:
            if not (Decimal("0") <= self.score_prenhez <= Decimal("1")):
                raise ValueError("score_prenhez deve estar entre 0 e 1.")
        return self


class AnaliseIAResponse(AnaliseIABase):
    id:         UUID = Field(..., validation_alias="analise_id")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)