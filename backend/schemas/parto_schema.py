from datetime import date, datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict
from typing import Optional

from models.enums import TipoParto


class PartoCreate(BaseModel):
    inseminacao_id:      Optional[UUID]    = None
    data_parto:          date
    tipo_parto:          TipoParto
    num_crias:           int               = Field(..., ge=1)
    num_crias_vivas:     int               = Field(..., ge=0)
    peso_total_crias_kg: Optional[Decimal] = Field(None, gt=0, max_digits=6, decimal_places=2)
    houve_distorcia:     bool              = False
    houve_obito_matriz:  bool              = False
    observacoes:         Optional[str]     = None

    @field_validator("data_parto")
    @classmethod
    def nao_futura(cls, v: date) -> date:
        if v > date.today():
            raise ValueError("A data do parto não pode ser futura.")
        return v

    @model_validator(mode="after")
    def validar_consistencia(self) -> "PartoCreate":
        if self.num_crias_vivas > self.num_crias:
            raise ValueError("num_crias_vivas não pode ser maior que num_crias.")
        tipos_esperados = {TipoParto.SIMPLES: 1, TipoParto.DUPLO: 2}
        if self.tipo_parto in tipos_esperados and self.num_crias != tipos_esperados[self.tipo_parto]:
            raise ValueError(f"Tipo {self.tipo_parto.value} exige exatamente {tipos_esperados[self.tipo_parto]} cria(s).")
        if self.tipo_parto == TipoParto.MULTIPLO and self.num_crias < 3:
            raise ValueError("Tipo MULTIPLO exige no mínimo 3 crias.")
        return self


class PartoResponse(BaseModel):
    parto_id:            UUID
    animal_id:           UUID
    inseminacao_id:      Optional[UUID]
    data_parto:          date
    tipo_parto:          TipoParto
    num_crias:           int
    num_crias_vivas:     int
    peso_total_crias_kg: Optional[Decimal]
    houve_distorcia:     bool
    houve_obito_matriz:  bool
    observacoes:         Optional[str]
    created_at:          datetime
    iep_dias:            Optional[int] = None

    model_config = ConfigDict(from_attributes=True)
