from typing import Generic, TypeVar
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.base import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    def __init__(self, session: AsyncSession, model: type[ModelT]) -> None:
        self.session = session
        self.model = model

    async def get_by_id(self, pk: UUID) -> ModelT | None:
        stmt = select(self.model).where(self.model.__table__.c[self._pk_col()] == pk)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def delete(self, pk: UUID) -> bool:
        obj = await self.get_by_id(pk)
        if not obj:
            return False
        await self.session.delete(obj)
        await self.session.commit()
        return True

    def _pk_col(self) -> str:
        return self.model.__table__.primary_key.columns.keys()[0]
