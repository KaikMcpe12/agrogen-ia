from uuid import UUID
from typing import Optional

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from models.inseminacao_model import InseminacaoModel
from models.enums import ResultadoInseminacao
from repositories.base_repository import BaseRepository


class InseminacaoRepository(BaseRepository[InseminacaoModel]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, InseminacaoModel)

    async def create(self, data: dict) -> InseminacaoModel:
        obj = InseminacaoModel(**data)
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def list_all(
        self,
        animal_id: Optional[UUID] = None,
        tecnico_id: Optional[UUID] = None,
        resultado: Optional[ResultadoInseminacao] = None,
        limit: int = 10,
        offset: int = 0,
    ) -> list[InseminacaoModel]:
        filtros = []
        if animal_id:
            filtros.append(InseminacaoModel.animal_id == animal_id)
        if tecnico_id:
            filtros.append(InseminacaoModel.tecnico_id == tecnico_id)
        if resultado:
            filtros.append(InseminacaoModel.resultado == resultado)
        stmt = select(InseminacaoModel)
        if filtros:
            stmt = stmt.where(and_(*filtros))
        stmt = stmt.order_by(InseminacaoModel.data_inseminacao.desc()).offset(offset).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update(self, inseminacao_id: UUID, data: dict) -> Optional[InseminacaoModel]:
        obj = await self.get_by_id(inseminacao_id)
        if not obj:
            return None
        for key, value in data.items():
            setattr(obj, key, value)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj
