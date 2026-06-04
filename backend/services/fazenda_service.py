from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from repositories.fazenda_repository import FazendaRepository
from schemas.fazenda_schema import FazendaCreate, FazendaUpdate
from models.fazenda_model import FazendaModel


class FazendaService:
    def __init__(self, session: AsyncSession):
        self.repo = FazendaRepository(session)

    async def create(self, schema: FazendaCreate, usuario_id: UUID) -> FazendaModel:
        return await self.repo.create(schema, usuario_id)

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

    async def soft_delete(self, fazenda_id: UUID, usuario_id: UUID) -> None:
        fazenda = await self.repo.get_by_id(fazenda_id)
        if not fazenda:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fazenda não encontrada.")

        animais_ativos = await self.repo.count_animais_ativos(fazenda_id)
        if animais_ativos > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Fazenda possui {animais_ativos} animal(is) ativo(s). Remova ou transfira os animais antes de excluir.",
            )

        fazendas_ativas = await self.repo.count_fazendas_ativas(usuario_id)
        if fazendas_ativas <= 1:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Não é possível excluir a única fazenda ativa do usuário.",
            )

        await self.repo.soft_delete(fazenda_id)