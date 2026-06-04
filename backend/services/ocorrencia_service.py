from datetime import date
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from models.ocorrencia_model import OcorrenciaModel
from models.enums import GravidadeOcorrencia, TipoAlerta, PrioridadeAlerta, CategoriaOcorrencia
from repositories.ocorrencia_repository import OcorrenciaRepository
from repositories.animal_repository import AnimalRepository
from repositories.alerta_repository import AlertaRepository
from schemas.ocorrencia_schema import OcorrenciaCreate
from typing import Optional


class OcorrenciaService:
    def __init__(self, session: AsyncSession) -> None:
        self.repo        = OcorrenciaRepository(session)
        self.animal_repo = AnimalRepository(session)
        self.alerta_repo = AlertaRepository(session)

    async def create(self, animal_id: UUID, schema: OcorrenciaCreate) -> dict:
        animal = await self.animal_repo.get_by_id(animal_id)
        if not animal:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal não encontrado.")

        payload = schema.model_dump()
        payload["animal_id"] = animal_id
        ocorrencia = await self.repo.create(payload)

        alerta_criado = None
        if schema.gravidade == GravidadeOcorrencia.CRITICA:
            alerta = await self.alerta_repo.create({
                "animal_id":  animal_id,
                "tipo":       TipoAlerta.OCORRENCIA_CRITICA,
                "mensagem":   f"Ocorrência crítica: {schema.titulo}.",
                "data_disparo": date.today(),
                "prioridade": PrioridadeAlerta.CRITICA,
            })
            alerta_criado = {"alerta_id": str(alerta.alerta_id), "data_disparo": str(date.today())}

        return {"ocorrencia": ocorrencia, "alerta_criado": alerta_criado}

    async def list_by_animal(
        self,
        animal_id: UUID,
        categoria: Optional[CategoriaOcorrencia] = None,
        apenas_nao_resolvidas: bool = False,
        **kwargs,
    ) -> list[OcorrenciaModel]:
        animal = await self.animal_repo.get_by_id(animal_id)
        if not animal:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal não encontrado.")
        return await self.repo.list_by_animal(
            animal_id, categoria=categoria,
            apenas_nao_resolvidas=apenas_nao_resolvidas, **kwargs,
        )

    async def marcar_resolvida(self, ocorrencia_id: UUID) -> OcorrenciaModel:
        obj = await self.repo.marcar_resolvida(ocorrencia_id)
        if not obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ocorrência não encontrada.")
        return obj

    async def get_by_id(self, ocorrencia_id: UUID) -> OcorrenciaModel:
        obj = await self.repo.get_by_id(ocorrencia_id)
        if not obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ocorrência não encontrada.")
        return obj
