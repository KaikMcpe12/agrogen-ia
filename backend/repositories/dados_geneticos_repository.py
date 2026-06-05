from uuid import UUID
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.dados_geneticos_model import DadosGeneticosModel
from repositories.base_repository import BaseRepository


class DadosGeneticosRepository(BaseRepository[DadosGeneticosModel]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, DadosGeneticosModel)

    async def get_by_animal_id(self, animal_id: UUID) -> Optional[DadosGeneticosModel]:
        stmt = select(DadosGeneticosModel).where(DadosGeneticosModel.animal_id == animal_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def upsert(self, animal_id: UUID, data: dict) -> DadosGeneticosModel:
        obj = await self.get_by_animal_id(animal_id)
        if obj is None:
            obj = DadosGeneticosModel(animal_id=animal_id, **data)
            self.session.add(obj)
        else:
            for key, value in data.items():
                setattr(obj, key, value)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj
