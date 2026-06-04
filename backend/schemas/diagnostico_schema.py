from pydantic import BaseModel
from uuid import UUID
from datetime import date
from typing import Optional


class DiagnosticoCreate(BaseModel):
    inseminacao_id: UUID
    animal_id: UUID
    data_diagnostico: date
    metodo: str
    resultado: str
    dias_gestacao_est: Optional[int] = None
    data_parto_prevista: Optional[date] = None
    veterinario_id: Optional[UUID] = None
    observacoes: Optional[str] = None