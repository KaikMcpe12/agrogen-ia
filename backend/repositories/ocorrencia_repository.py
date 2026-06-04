from uuid import UUID
from typing import Optional

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from models.ocorrencia_model import OcorrenciaModel
from models.enums import CategoriaOcorrencia, GravidadeOcorrencia
from repositories.base_repository import BaseRepository


class OcorrenciaRepository(BaseRepository[OcorrenciaModel]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, OcorrenciaModel)

    async def create(self, data: dict) -> OcorrenciaModel:
        obj = OcorrenciaModel(**data)
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def list_by_animal(
        self,
        animal_id: UUID,
        categoria: Optional[CategoriaOcorrencia] = None,
        gravidade: Optional[GravidadeOcorrencia] = None,
        apenas_nao_resolvidas: bool = False,
        limit: int = 20,
        offset: int = 0,
    ) -> list[OcorrenciaModel]:
        filtros = [OcorrenciaModel.animal_id == animal_id]
        if categoria:
            filtros.append(OcorrenciaModel.categoria == categoria)
        if gravidade:
            filtros.append(OcorrenciaModel.gravidade == gravidade)
        if apenas_nao_resolvidas:
            filtros.append(OcorrenciaModel.resolvida == False)
        stmt = (
            select(OcorrenciaModel)
            .where(and_(*filtros))
            .order_by(OcorrenciaModel.data.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def marcar_resolvida(self, ocorrencia_id: UUID) -> Optional[OcorrenciaModel]:
        obj = await self.get_by_id(ocorrencia_id)
        if not obj:
            return None
        obj.resolvida = True
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def update(self, ocorrencia_id: UUID, data: dict) -> Optional[OcorrenciaModel]:
        obj = await self.get_by_id(ocorrencia_id)
        if not obj:
            return None
        for key, value in data.items():
            setattr(obj, key, value)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj
