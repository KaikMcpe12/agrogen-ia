from datetime import datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, Field, model_validator, ConfigDict
from typing import Optional

from models.enums import TipoProducao

ESTADOS_VALIDOS = {
    'AC','AL','AP','AM','BA','CE','DF','ES','GO',
    'MA','MT','MS','MG','PA','PB','PR','PE','PI',
    'RJ','RN','RS','RO','RR','SC','SP','SE','TO'
}

class FazendaBase(BaseModel):
    usuario_id:         UUID
    nome:               str            = Field(..., min_length=1, max_length=120)
    municipio:          str            = Field(..., min_length=1, max_length=100)
    estado:             str            = Field(..., min_length=2, max_length=2)
    latitude:           Optional[Decimal] = Field(None, ge=-90,  le=90)
    longitude:          Optional[Decimal] = Field(None, ge=-180, le=180)
    area_hectares:      Optional[Decimal] = Field(None, gt=0)
    tipo_producao:      Optional[TipoProducao] = None
    capacidade_rebanho: Optional[int]  = Field(None, gt=0)

    @model_validator(mode="after")
    def validar_regras(self) -> "FazendaBase":
        if self.estado.upper() not in ESTADOS_VALIDOS:
            raise ValueError(f"Estado inválido: {self.estado}.")

        lat, lon = self.latitude, self.longitude
        if (lat is None) != (lon is None):
            raise ValueError("latitude e longitude devem ser informadas juntas ou omitidas juntas.")

        return self


class FazendaCreate(FazendaBase):
    pass


class FazendaUpdate(BaseModel):
    nome:               Optional[str]            = Field(None, min_length=1, max_length=120)
    municipio:          Optional[str]            = Field(None, min_length=1, max_length=100)
    estado:             Optional[str]            = Field(None, min_length=2, max_length=2)
    latitude:           Optional[Decimal]        = Field(None, ge=-90,  le=90)
    longitude:          Optional[Decimal]        = Field(None, ge=-180, le=180)
    area_hectares:      Optional[Decimal]        = Field(None, gt=0)
    tipo_producao:      Optional[TipoProducao]   = None
    capacidade_rebanho: Optional[int]            = Field(None, gt=0)

    @model_validator(mode="after")
    def validar_regras(self) -> "FazendaUpdate":
        if self.estado and self.estado.upper() not in ESTADOS_VALIDOS:
            raise ValueError(f"Estado inválido: {self.estado}.")

        lat, lon = self.latitude, self.longitude
        if (lat is None) != (lon is None):
            raise ValueError("latitude e longitude devem ser informadas juntas ou omitidas juntas.")

        return self


class FazendaResponse(FazendaBase):
    fazenda_id: UUID
    ativo:      bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)