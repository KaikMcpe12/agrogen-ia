from uuid import UUID
from typing import Optional

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from models.alimentacao_model import AlimentacaoModel
from repositories.base_repository import BaseRepository


class AlimentacaoRepository(BaseRepository[AlimentacaoModel]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, AlimentacaoModel)

    async def create(self, data: dict) -> AlimentacaoModel:
        obj = AlimentacaoModel(**data)
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def list_by_animal(
        self,
        animal_id: UUID,
        apenas_ativo: bool = False,
        limit: int = 20,
        offset: int = 0,
    ) -> list[AlimentacaoModel]:
        filtros = [AlimentacaoModel.animal_id == animal_id]
        if apenas_ativo:
            filtros.append(AlimentacaoModel.data_fim == None)
        stmt = (
            select(AlimentacaoModel)
            .where(and_(*filtros))
            .order_by(AlimentacaoModel.data_inicio.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update(self, alimentacao_id: UUID, data: dict) -> Optional[AlimentacaoModel]:
        obj = await self.get_by_id(alimentacao_id)
        if not obj:
            return None
        for key, value in data.items():
            setattr(obj, key, value)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj
