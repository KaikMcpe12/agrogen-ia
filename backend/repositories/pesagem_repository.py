from datetime import date
from uuid import UUID
from typing import Optional

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from models.pesagem_model import PesagemModel
from models.enums import EstagioPesagem
from repositories.base_repository import BaseRepository


class PesagemRepository(BaseRepository[PesagemModel]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, PesagemModel)

    async def create(self, data: dict) -> PesagemModel:
        obj = PesagemModel(**data)
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def list_by_animal(
        self,
        animal_id: UUID,
        estagio: Optional[EstagioPesagem] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[PesagemModel]:
        filtros = [PesagemModel.animal_id == animal_id]
        if estagio:
            filtros.append(PesagemModel.estagio == estagio)
        stmt = (
            select(PesagemModel)
            .where(and_(*filtros))
            .order_by(PesagemModel.data.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_pesagem_anterior(self, animal_id: UUID, data_ref: date) -> Optional[PesagemModel]:
        stmt = (
            select(PesagemModel)
            .where(PesagemModel.animal_id == animal_id, PesagemModel.data < data_ref)
            .order_by(PesagemModel.data.desc())
            .limit(1)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def update(self, pesagem_id: UUID, data: dict) -> Optional[PesagemModel]:
        obj = await self.get_by_id(pesagem_id)
        if not obj:
            return None
        for key, value in data.items():
            setattr(obj, key, value)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj
