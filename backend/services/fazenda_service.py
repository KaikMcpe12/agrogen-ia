from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from repositories.fazenda_repository import FazendaRepository
from schemas.fazenda_schema import FazendaCreate, FazendaUpdate
from models.fazenda_model import FazendaModel


class FazendaService:
    def __init__(self, session: AsyncSession):
        self.repo = FazendaRepository(session)

    async def create(self, schema: FazendaCreate) -> FazendaModel:
        return await self.repo.create(schema)

    async def get_by_id(self, fazenda_id: UUID) -> FazendaModel:
        fazenda = await self.repo.get_by_id(fazenda_id)
        if not fazenda:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fazenda não encontrada.")
        return fazenda

    async def list_all(self, **kwargs) -> list[FazendaModel]:
        return await self.repo.list_all(**kwargs)

    async def update(self, fazenda_id: UUID, schema: FazendaUpdate) -> FazendaModel:
        fazenda = await self.repo.update(fazenda_id, schema)
        if not fazenda:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fazenda não encontrada.")
        return fazenda

    async def soft_delete(self, fazenda_id: UUID) -> None:
        sucesso = await self.repo.soft_delete(fazenda_id)
        if not sucesso:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fazenda não encontrada ou já inativa.")