from uuid import UUID
from typing import Optional

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from models.alerta_model import AlertaModel
from models.enums import TipoAlerta, PrioridadeAlerta
from repositories.base_repository import BaseRepository


class AlertaRepository(BaseRepository[AlertaModel]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, AlertaModel)

    async def create(self, data: dict) -> AlertaModel:
        obj = AlertaModel(**data)
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def list_pendentes(
        self,
        animal_id: Optional[UUID] = None,
        tipo: Optional[TipoAlerta] = None,
        prioridade: Optional[PrioridadeAlerta] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[AlertaModel]:
        filtros = [AlertaModel.resolvido == False]
        if animal_id:
            filtros.append(AlertaModel.animal_id == animal_id)
        if tipo:
            filtros.append(AlertaModel.tipo == tipo)
        if prioridade:
            filtros.append(AlertaModel.prioridade == prioridade)
        stmt = (
            select(AlertaModel)
            .where(and_(*filtros))
            .order_by(AlertaModel.data_disparo.asc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def marcar_lido(self, alerta_id: UUID) -> Optional[AlertaModel]:
        obj = await self.get_by_id(alerta_id)
        if not obj:
            return None
        obj.lido = True
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def marcar_resolvido(self, alerta_id: UUID) -> Optional[AlertaModel]:
        obj = await self.get_by_id(alerta_id)
        if not obj:
            return None
        obj.resolvido = True
        await self.session.commit()
        await self.session.refresh(obj)
        return obj
