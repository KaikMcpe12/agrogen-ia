from uuid import UUID
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.parto_model import PartoModel
from repositories.base_repository import BaseRepository


class PartoRepository(BaseRepository[PartoModel]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, PartoModel)

    async def create(self, data: dict) -> PartoModel:
        obj = PartoModel(**data)
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def list_by_animal(
        self,
        animal_id: UUID,
        limit: int = 10,
        offset: int = 0,
    ) -> list[PartoModel]:
        stmt = (
            select(PartoModel)
            .where(PartoModel.animal_id == animal_id)
            .order_by(PartoModel.data_parto.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
