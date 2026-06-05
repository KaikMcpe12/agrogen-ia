from uuid import UUID
from typing import Optional

from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from models.reprodutor_model import ReproductorModel
from models.enums import EspecieAnimal, TipoReprodutor
from repositories.base_repository import BaseRepository


class ReproductorRepository(BaseRepository[ReproductorModel]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, ReproductorModel)

    async def create(self, data: dict) -> ReproductorModel:
        obj = ReproductorModel(**data)
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def get_by_animal_id(self, animal_id: UUID) -> Optional[ReproductorModel]:
        stmt = select(ReproductorModel).where(
            ReproductorModel.animal_id == animal_id,
            ReproductorModel.ativo == True,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(
        self,
        especie:       Optional[EspecieAnimal]   = None,
        tipo:          Optional[TipoReprodutor]  = None,
        q:             Optional[str]             = None,
        apenas_ativos: bool                      = True,
        limit:         int                       = 20,
        offset:        int                       = 0,
    ) -> list[ReproductorModel]:
        filtros = []
        if apenas_ativos:
            filtros.append(ReproductorModel.ativo == True)
        if especie:
            filtros.append(ReproductorModel.especie == especie)
        if tipo:
            filtros.append(ReproductorModel.tipo == tipo)
        if q:
            termo = f"%{q}%"
            filtros.append(or_(
                ReproductorModel.nome.ilike(termo),
                ReproductorModel.raca.ilike(termo),
            ))
        stmt = select(ReproductorModel)
        if filtros:
            stmt = stmt.where(and_(*filtros))
        stmt = stmt.order_by(ReproductorModel.nome).offset(offset).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update(self, reprodutor_id: UUID, data: dict) -> Optional[ReproductorModel]:
        obj = await self.get_by_id(reprodutor_id)
        if not obj:
            return None
        for key, value in data.items():
            setattr(obj, key, value)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def soft_delete(self, reprodutor_id: UUID) -> bool:
        obj = await self.get_by_id(reprodutor_id)
        if not obj:
            return False
        obj.ativo = False
        await self.session.commit()
        return True
