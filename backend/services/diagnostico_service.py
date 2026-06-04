from uuid import UUID
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from repositories.diagnostico_repository import DiagnosticoRepository
from schemas.diagnostico_schema import DiagnosticoCreate, DiagnosticoUpdate
from models.diagnostico_model import DiagnosticoModel
from models.enums import ResultadoDiagnostico


class DiagnosticoService:
    def __init__(self, session: AsyncSession):
        self.repo = DiagnosticoRepository(session)

    async def create(self, schema: DiagnosticoCreate) -> DiagnosticoModel:
        return await self.repo.create(schema)

    async def get_by_id(self, diagnostico_id: UUID) -> DiagnosticoModel:
        diag = await self.repo.get_by_id(diagnostico_id)
        if not diag:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Diagnóstico não encontrado.")
        return diag

    async def list_by_animal(self, **kwargs) -> list[DiagnosticoModel]:
        return await self.repo.list_by_animal(**kwargs)

    async def update(self, diagnostico_id: UUID, schema: DiagnosticoUpdate) -> DiagnosticoModel:
        diag = await self.repo.get_by_id(diagnostico_id)
        if not diag:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Diagnóstico não encontrado.")

        novo_resultado = schema.resultado or diag.resultado
        novos_dias     = schema.dias_gestacao_est if schema.dias_gestacao_est is not None else diag.dias_gestacao_est

        if novo_resultado == ResultadoDiagnostico.PRENHA and not novos_dias:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="dias_gestacao_est é obrigatório quando resultado é PRENHA."
            )

        return await self.repo.update(diagnostico_id, schema)

    async def delete(self, diagnostico_id: UUID) -> None:
        sucesso = await self.repo.delete(diagnostico_id)
        if not sucesso:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Diagnóstico não encontrado.")