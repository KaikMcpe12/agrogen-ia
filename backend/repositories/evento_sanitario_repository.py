from uuid import UUID
from typing import Optional

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from models.evento_sanitario_model import EventoSanitarioModel
from models.enums import TipoSanitario
from repositories.base_repository import BaseRepository


class EventoSanitarioRepository(BaseRepository[EventoSanitarioModel]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, EventoSanitarioModel)

    async def create(self, data: dict) -> EventoSanitarioModel:
        obj = EventoSanitarioModel(**data)
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def list_by_animal(
        self,
        animal_id: UUID,
        tipo: Optional[TipoSanitario] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[EventoSanitarioModel]:
        filtros = [EventoSanitarioModel.animal_id == animal_id]
        if tipo:
            filtros.append(EventoSanitarioModel.tipo == tipo)
        stmt = (
            select(EventoSanitarioModel)
            .where(and_(*filtros))
            .order_by(EventoSanitarioModel.data_aplicacao.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update(self, evento_id: UUID, data: dict) -> Optional[EventoSanitarioModel]:
        obj = await self.get_by_id(evento_id)
        if not obj:
            return None
        for key, value in data.items():
            setattr(obj, key, value)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj
