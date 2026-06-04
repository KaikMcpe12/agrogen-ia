from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel, Field, model_validator, ConfigDict
from typing import Optional
from models.enums import MetodoDiagnostico, ResultadoDiagnostico


class DiagnosticoBase(BaseModel):
    inseminacao_id:      UUID
    animal_id:           UUID
    data_diagnostico:    date
    metodo:              MetodoDiagnostico
    resultado:           ResultadoDiagnostico
    dias_gestacao_est:   Optional[int]  = Field(None, gt=0)
    data_parto_prevista: Optional[date] = None
    veterinario_id:      Optional[UUID] = None
    observacoes:         Optional[str]  = None

    @model_validator(mode="after")
    def validar_regras(self) -> "DiagnosticoBase":
        if self.data_diagnostico > date.today():
            raise ValueError("data_diagnostico não pode ser futura.")

        if self.data_parto_prevista and self.data_parto_prevista <= self.data_diagnostico:
            raise ValueError("data_parto_prevista deve ser posterior à data_diagnostico.")

        if self.resultado == ResultadoDiagnostico.PRENHA and not self.dias_gestacao_est:
            raise ValueError("dias_gestacao_est é obrigatório quando resultado é PRENHA.")

        return self


class DiagnosticoCreate(DiagnosticoBase):
    pass


class DiagnosticoUpdate(BaseModel):
    metodo:              Optional[MetodoDiagnostico]    = None
    resultado:           Optional[ResultadoDiagnostico] = None
    dias_gestacao_est:   Optional[int]  = Field(None, gt=0)
    data_parto_prevista: Optional[date] = None
    veterinario_id:      Optional[UUID] = None
    observacoes:         Optional[str]  = None


class DiagnosticoResponse(DiagnosticoBase):
    diagnostico_id: UUID
    created_at:     datetime

    model_config = ConfigDict(from_attributes=True)