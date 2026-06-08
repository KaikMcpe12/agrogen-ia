from datetime import datetime, date
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict
from typing import Optional

from models.enums import TipoInseminacao, ResultadoInseminacao


class InseminacaoCreate(BaseModel):
    animal_id:                 UUID
    reprodutor_id:             UUID
    protocolo_id:              Optional[UUID]    = None
    protocolo_descricao:       Optional[str]     = None
    data_inseminacao:          datetime
    tipo:                      TipoInseminacao
    condicao_corporal_momento: int               = Field(..., ge=1, le=5)
    temperatura_ambiente_c:    Optional[Decimal] = None
    observacoes:               Optional[str]     = None
    forcar_registro:           bool              = False

    @field_validator("data_inseminacao")
    @classmethod
    def nao_futura(cls, v: datetime) -> datetime:
        from datetime import timezone
        agora = datetime.now(timezone.utc)
        v_aware = v.replace(tzinfo=timezone.utc) if v.tzinfo is None else v
        if v_aware > agora:
            raise ValueError("A data da inseminação não pode ser futura.")
        return v

    @model_validator(mode="after")
    def iatf_requer_protocolo(self) -> "InseminacaoCreate":
        if self.tipo == TipoInseminacao.IATF and not self.protocolo_id and not self.protocolo_descricao:
            raise ValueError("protocolo_id ou protocolo_descricao é obrigatório para inseminações do tipo IATF.")
        return self


class InseminacaoUpdate(BaseModel):
    resultado:   Optional[ResultadoInseminacao] = None
    observacoes: Optional[str]                  = None


class InseminacaoResponse(BaseModel):
    id:                        UUID = Field(..., validation_alias="inseminacao_id")
    animal_id:                 UUID
    reprodutor_id:             UUID
    tecnico_id:                UUID
    protocolo_id:              Optional[UUID]
    data_inseminacao:          datetime
    tipo:                      TipoInseminacao
    condicao_corporal_momento: int
    temperatura_ambiente_c:    Optional[Decimal]
    dias_pos_parto:            Optional[int]
    dias_desde_ultima_ins:     Optional[int]
    ciclos_sem_concepcao:      int
    historico_prenhez:         int
    observacoes:               Optional[str]
    resultado:                 ResultadoInseminacao
    created_at:                datetime
    updated_at:                datetime
    warnings:                  list[str] = []

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class DiagnosticoViaInseminacaoCreate(BaseModel):
    data_diagnostico:   date
    metodo:             str
    resultado:          str
    dias_gestacao_est:  Optional[int] = Field(None, gt=0)
    data_parto_prevista: Optional[date] = None
    veterinario_id:     Optional[UUID] = None
    observacoes:        Optional[str]  = None

    @field_validator("data_diagnostico")
    @classmethod
    def nao_futura(cls, v: date) -> date:
        from datetime import date as d
        if v > d.today():
            raise ValueError("A data do diagnóstico não pode ser futura.")
        return v

    @model_validator(mode="after")
    def prenha_requer_dias(self) -> "DiagnosticoViaInseminacaoCreate":
        from models.enums import ResultadoDiagnostico
        if self.resultado == ResultadoDiagnostico.PRENHA.value and not self.dias_gestacao_est:
            raise ValueError("dias_gestacao_est é obrigatório quando resultado=PRENHA.")
        return self
