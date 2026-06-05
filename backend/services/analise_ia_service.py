from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from repositories.analise_ia_repository import AnaliseIARepository
from schemas.analise_ia_schema import AnaliseIACreate, AnaliseIAUpdate
from models.analise_ia_model import AnaliseIAModel


class AnaliseIAService:
    def __init__(self, session: AsyncSession):
        self.repo = AnaliseIARepository(session)

    async def create(self, schema: AnaliseIACreate) -> AnaliseIAModel:
        return await self.repo.create(schema)

    async def get_by_id(self, analise_id: UUID) -> AnaliseIAModel:
        analise = await self.repo.get_by_id(analise_id)
        if not analise:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Análise não encontrada.")
        return analise

    async def list_all(self, **kwargs) -> list[AnaliseIAModel]:
        return await self.repo.list_all(**kwargs)

    async def update(self, analise_id: UUID, schema: AnaliseIAUpdate) -> AnaliseIAModel:
        analise = await self.repo.update(analise_id, schema)
        if not analise:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Análise não encontrada.")
        return analise

    async def delete(self, analise_id: UUID) -> None:
        sucesso = await self.repo.delete(analise_id)
        if not sucesso:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Análise não encontrada.")