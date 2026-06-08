from uuid import UUID
from typing import Optional

from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.protocolo_hormonal_model import ProtocoloHormonalModel
from models.enums import EspecieAnimal
from repositories.base_repository import BaseRepository


class ProtocoloHormonalRepository(BaseRepository[ProtocoloHormonalModel]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, ProtocoloHormonalModel)

    async def get_by_nome(self, nome: str, especie: Optional[EspecieAnimal] = None) -> Optional[ProtocoloHormonalModel]:
        """Busca protocolo por nome (case-insensitive). Retorna o primeiro match."""
        filtros = [func.lower(ProtocoloHormonalModel.nome) == nome.strip().lower()]
        if especie:
            filtros.append(ProtocoloHormonalModel.especie == especie)
        stmt = select(ProtocoloHormonalModel).where(and_(*filtros)).limit(1)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def create(self, data: dict) -> ProtocoloHormonalModel:
        obj = ProtocoloHormonalModel(**data)
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def list_all(
        self,
        especie: Optional[EspecieAnimal] = None,
        apenas_ativos: bool = True,
        limit: int = 20,
        offset: int = 0,
    ) -> list[ProtocoloHormonalModel]:
        filtros = []
        if especie:
            filtros.append(ProtocoloHormonalModel.especie == especie)
        if apenas_ativos:
            filtros.append(ProtocoloHormonalModel.ativo == True)
        stmt = select(ProtocoloHormonalModel)
        if filtros:
            stmt = stmt.where(and_(*filtros))
        stmt = stmt.order_by(ProtocoloHormonalModel.nome).offset(offset).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update(self, protocolo_id: UUID, data: dict) -> Optional[ProtocoloHormonalModel]:
        obj = await self.get_by_id(protocolo_id)
        if not obj:
            return None
        for key, value in data.items():
            setattr(obj, key, value)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj
