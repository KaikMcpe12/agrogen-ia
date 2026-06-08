from datetime import date, datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict
from typing import Optional, Any

from models.enums import EspecieAnimal, SexoAnimal, StatusAnimal


class DadosGeneticosInput(BaseModel):
    raca_pai:            Optional[str]     = Field(None, max_length=80)
    raca_mae:            Optional[str]     = Field(None, max_length=80)
    percentual_sangue:   Optional[str]     = Field(None, max_length=60)
    dep_peso_desmame:    Optional[Decimal] = None
    dep_fertilidade:     Optional[Decimal] = None
    dep_acuracia:        Optional[Decimal] = Field(None, ge=0, le=1)
    coeficiente_endogamia: Optional[Decimal] = Field(None, ge=0, le=1)
    heterose_esperada:   Optional[Decimal] = None


class DadosGeneticosOutput(DadosGeneticosInput):
    model_config = ConfigDict(from_attributes=True)

class AnimalBase(BaseModel):
    fazenda_id: UUID
    codigo: str = Field(..., max_length=20, min_length=1)
    nome: str = Field(..., max_length=100, min_length=1)
    especie: EspecieAnimal
    sexo: SexoAnimal
    data_nascimento: date
    raca_principal: Optional[str] = Field(None, max_length=80)
    peso_inicial_kg: Decimal = Field(..., max_digits=6, decimal_places=2)
    condicao_corporal: int = Field(..., ge=1, le=5)
    brinco: Optional[str] = Field(None, max_length=50)
    status: StatusAnimal = StatusAnimal.ATIVA
    num_partos: int = Field(0, ge=0)
    data_ultimo_parto: Optional[date] = None
    observacoes: Optional[str] = None

    @field_validator("data_nascimento")
    @classmethod
    def validar_data_nascimento(cls, v: date) -> date:
        if v > date.today():
            raise ValueError("A data de nascimento não pode ser uma data futura.")
        return v

    @model_validator(mode="after")
    def validar_regras_cruzadas(self) -> "AnimalBase":
        # Validação do Sexo vs Número de Partos
        if self.sexo == SexoAnimal.MACHO and self.num_partos > 0:
            raise ValueError("Animais do sexo MACHO não podem possuir partos.")

        # Validação de Faixa de Peso por Espécie
        peso = self.peso_inicial_kg
        if self.especie == EspecieAnimal.BOVINO and not (50 <= peso <= 900):
            raise ValueError("Peso inicial para BOVINO deve ser entre 50kg e 900kg.")
        elif self.especie == EspecieAnimal.OVINO and not (10 <= peso <= 120):
            raise ValueError("Peso inicial para OVINO deve ser entre 10kg e 120kg.")
        elif self.especie == EspecieAnimal.CAPRINO and not (8 <= peso <= 100):
            raise ValueError("Peso inicial para CAPRINO deve ser entre 8kg e 100kg.")

        return self

class AnimalCreate(AnimalBase):
    codigo:          Optional[str]                 = Field(None, max_length=20, min_length=1)
    dados_geneticos: Optional[DadosGeneticosInput] = None

class AnimalUpdate(BaseModel):
    codigo: Optional[str] = Field(None, max_length=20)
    nome: Optional[str] = Field(None, max_length=100)
    especie: Optional[EspecieAnimal] = None
    sexo: Optional[SexoAnimal] = None
    data_nascimento: Optional[date] = None
    raca_principal: Optional[str] = Field(None, max_length=80)
    peso_inicial_kg: Optional[Decimal] = Field(None, max_digits=6, decimal_places=2)
    condicao_corporal: Optional[int] = Field(None, ge=1, le=5)
    brinco: Optional[str] = Field(None, max_length=50)
    status: Optional[StatusAnimal] = None
    num_partos: Optional[int] = Field(None, ge=0)
    data_ultimo_parto: Optional[date] = None
    observacoes: Optional[str] = None

    @model_validator(mode="after")
    def validar_update_regras(self) -> "AnimalUpdate":
        if self.data_nascimento and self.data_nascimento > date.today():
            raise ValueError("A data de nascimento não pode ser uma data futura.")
        return self

class AnimalResponse(AnimalBase):
    id:              UUID                          = Field(..., validation_alias="animal_id")
    ativo:           bool
    created_at:      datetime
    updated_at:      datetime
    idade_meses:     Optional[int]                 = None
    dados_geneticos: Optional[DadosGeneticosOutput] = None
    ultimo_evento:   Optional[dict[str, Any]]      = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)