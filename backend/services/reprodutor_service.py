from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from models.reprodutor_model import ReproductorModel
from models.enums import SexoAnimal
from repositories.reprodutor_repository import ReproductorRepository
from repositories.animal_repository import AnimalRepository
from schemas.reprodutor_schema import ReproductorCreate, ReproductorUpdate
from models.enums import TipoReprodutor


class ReproductorService:
    def __init__(self, session: AsyncSession) -> None:
        self.repo        = ReproductorRepository(session)
        self.animal_repo = AnimalRepository(session)

    async def create(self, schema: ReproductorCreate) -> ReproductorModel:
        if schema.tipo == TipoReprodutor.ANIMAL_PROPRIO:
            animal = await self.animal_repo.get_by_id(schema.animal_id)
            if not animal:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal vinculado não encontrado.")
            if animal.sexo != SexoAnimal.MACHO:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Apenas animais MACHO podem ser registrados como reprodutores.")
            if animal.especie != schema.especie:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Espécie do reprodutor ({schema.especie.value}) diverge da espécie do animal ({animal.especie.value}).")

            existente = await self.repo.get_by_animal_id(schema.animal_id)
            if existente:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Animal já está registrado como reprodutor ativo.")

        return await self.repo.create(schema.model_dump())

    async def get_by_id(self, reprodutor_id: UUID) -> ReproductorModel:
        obj = await self.repo.get_by_id(reprodutor_id)
        if not obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reprodutor não encontrado.")
        return obj

    async def list_all(self, **kwargs) -> list[ReproductorModel]:
        return await self.repo.list_all(**kwargs)

    async def update(self, reprodutor_id: UUID, schema: ReproductorUpdate) -> ReproductorModel:
        obj = await self.repo.update(reprodutor_id, schema.model_dump(exclude_unset=True))
        if not obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reprodutor não encontrado.")
        return obj

    async def soft_delete(self, reprodutor_id: UUID) -> None:
        sucesso = await self.repo.soft_delete(reprodutor_id)
        if not sucesso:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reprodutor não encontrado.")
