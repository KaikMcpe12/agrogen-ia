from datetime import timedelta
from uuid import UUID
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from models.evento_sanitario_model import EventoSanitarioModel
from models.enums import TipoSanitario, TipoAlerta, PrioridadeAlerta
from repositories.evento_sanitario_repository import EventoSanitarioRepository
from repositories.animal_repository import AnimalRepository
from repositories.alerta_repository import AlertaRepository
from schemas.evento_sanitario_schema import EventoSanitarioCreate


class EventoSanitarioService:
    def __init__(self, session: AsyncSession) -> None:
        self.repo        = EventoSanitarioRepository(session)
        self.animal_repo = AnimalRepository(session)
        self.alerta_repo = AlertaRepository(session)

    async def create(self, animal_id: UUID, schema: EventoSanitarioCreate, usuario_id: UUID) -> dict:
        animal = await self.animal_repo.get_by_id(animal_id)
        if not animal:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal não encontrado.")

        payload = schema.model_dump()
        payload["animal_id"] = animal_id
        evento = await self.repo.create(payload)

        alerta_criado = None
        if schema.proxima_dose:
            data_disparo = schema.proxima_dose - timedelta(days=7)
            alerta = await self.alerta_repo.create({
                "animal_id":    animal_id,
                "sanitario_id": evento.evento_san_id,
                "tipo":         TipoAlerta.PROXIMA_DOSE,
                "mensagem":     f"Próxima dose de {schema.produto} prevista para {schema.proxima_dose.strftime('%d/%m/%Y')}.",
                "data_disparo": data_disparo,
                "prioridade":   PrioridadeAlerta.MEDIA,
            })
            alerta_criado = {"alerta_id": str(alerta.alerta_id), "data_disparo": str(data_disparo)}

        return {"evento": evento, "alerta_criado": alerta_criado}

    async def list_by_animal(self, animal_id: UUID, tipo: Optional[TipoSanitario] = None, **kwargs) -> list[EventoSanitarioModel]:
        animal = await self.animal_repo.get_by_id(animal_id)
        if not animal:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal não encontrado.")
        return await self.repo.list_by_animal(animal_id, tipo=tipo, **kwargs)

    async def get_by_id(self, evento_id: UUID) -> EventoSanitarioModel:
        obj = await self.repo.get_by_id(evento_id)
        if not obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento sanitário não encontrado.")
        return obj

    async def delete(self, evento_id: UUID) -> None:
        ok = await self.repo.delete(evento_id)
        if not ok:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento sanitário não encontrado.")
