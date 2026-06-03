from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from models import AnimalModel
from schemas import AnimalCreate, AnimalUpdate
from repositories.animal_repository import AnimalRepository
from models.enums import EspecieAnimal, SexoAnimal


class AnimalService:
    def __init__(self, session: AsyncSession):
        self.repo = AnimalRepository(session)

    async def create(self, schema: AnimalCreate) -> AnimalModel:
        return await self.repo.create(schema)

    async def get_by_id(self, animal_id: UUID) -> AnimalModel:
        animal = await self.repo.get_by_id(animal_id)
        if not animal:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal não encontrado.")
        return animal

    async def list_all(self, **kwargs) -> list[AnimalModel]:
        return await self.repo.list_all(**kwargs)

    async def update(self, animal_id: UUID, schema: AnimalUpdate) -> AnimalModel:
        animal = await self.repo.get_by_id(animal_id)
        if not animal:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal não encontrado.")

        # merge: valor do patch ou valor atual do banco
        sexo        = schema.sexo        or animal.sexo
        num_partos  = schema.num_partos  if schema.num_partos is not None else animal.num_partos
        especie     = schema.especie     or animal.especie
        peso        = schema.peso_inicial_kg or animal.peso_inicial_kg

        if sexo == SexoAnimal.MACHO and num_partos > 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Machos não podem ter partos."
            )

        limites = {
            EspecieAnimal.BOVINO:  (50,  900),
            EspecieAnimal.OVINO:   (10,  120),
            EspecieAnimal.CAPRINO: (8,   100),
        }
        minimo, maximo = limites[especie]
        if not (minimo <= float(peso) <= maximo):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Peso incompatível para {especie.value} ({minimo}kg–{maximo}kg)."
            )

        result = await self.repo.update(animal_id, schema)
        return result

    async def soft_delete(self, animal_id: UUID) -> None:
        sucesso = await self.repo.soft_delete(animal_id)
        if not sucesso:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Animal não encontrado ou já removido."
            )