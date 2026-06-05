from uuid import UUID
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from models.alerta_model import AlertaModel
from models.enums import TipoAlerta, PrioridadeAlerta
from repositories.alerta_repository import AlertaRepository
from schemas.alerta_schema import AlertaBadgeResponse


class AlertaService:
    def __init__(self, session: AsyncSession) -> None:
        self.repo = AlertaRepository(session)

    async def list_pendentes(
        self,
        animal_id:  Optional[UUID]           = None,
        tipo:       Optional[TipoAlerta]      = None,
        prioridade: Optional[PrioridadeAlerta] = None,
        limit:      int                       = 20,
        offset:     int                       = 0,
    ) -> list[AlertaModel]:
        return await self.repo.list_pendentes(
            animal_id=animal_id, tipo=tipo, prioridade=prioridade,
            limit=limit, offset=offset,
        )

    async def get_badge(self) -> AlertaBadgeResponse:
        dados = await self.repo.count_badge()
        return AlertaBadgeResponse(**dados)

    async def get_by_id(self, alerta_id: UUID) -> AlertaModel:
        obj = await self.repo.get_by_id(alerta_id)
        if not obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alerta não encontrado.")
        return obj

    async def marcar_lido(self, alerta_id: UUID) -> AlertaModel:
        obj = await self.repo.marcar_lido(alerta_id)
        if not obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alerta não encontrado.")
        return obj

    async def marcar_resolvido(self, alerta_id: UUID) -> AlertaModel:
        obj = await self.repo.marcar_resolvido(alerta_id)
        if not obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alerta não encontrado.")
        return obj
