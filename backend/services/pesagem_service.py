from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from models.pesagem_model import PesagemModel
from models.enums import EspecieAnimal
from repositories.pesagem_repository import PesagemRepository
from repositories.animal_repository import AnimalRepository
from schemas.pesagem_schema import PesagemCreate, PesagemUpdate

_FAIXAS: dict[EspecieAnimal, tuple[float, float]] = {
    EspecieAnimal.BOVINO:  (50, 900),
    EspecieAnimal.OVINO:   (10, 120),
    EspecieAnimal.CAPRINO: (8,  100),
}


class PesagemService:
    def __init__(self, session: AsyncSession) -> None:
        self.repo        = PesagemRepository(session)
        self.animal_repo = AnimalRepository(session)

    async def create(self, animal_id: UUID, schema: PesagemCreate) -> PesagemModel:
        animal = await self.animal_repo.get_by_id(animal_id)
        if not animal:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal não encontrado.")

        minimo, maximo = _FAIXAS[animal.especie]
        if not (minimo <= float(schema.peso_kg) <= maximo):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Peso fora da faixa para {animal.especie.value} ({minimo}–{maximo} kg).",
            )

        if schema.data < animal.data_nascimento:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Data da pesagem ({schema.data}) anterior ao nascimento do animal ({animal.data_nascimento}).",
            )

        # Calcula GMD em relação à pesagem anterior
        gmd: Decimal | None = None
        anterior = await self.repo.get_pesagem_anterior(animal_id, schema.data)
        if anterior:
            dias = (schema.data - anterior.data).days
            if dias > 0:
                gmd = Decimal(str((float(schema.peso_kg) - float(anterior.peso_kg)) / dias)).quantize(Decimal("0.001"), rounding=ROUND_HALF_UP)

        payload = schema.model_dump()
        payload["animal_id"] = animal_id
        payload["gmd_calculado"] = gmd
        return await self.repo.create(payload)

    async def list_by_animal(self, animal_id: UUID, **kwargs) -> dict:
        animal = await self.animal_repo.get_by_id(animal_id)
        if not animal:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal não encontrado.")
        items = await self.repo.list_by_animal(animal_id, **kwargs)
        resumo = {
            "ultima_pesagem_kg": float(items[0].peso_kg) if items else None,
            "gmd_ultimo": float(items[0].gmd_calculado) if items and items[0].gmd_calculado else None,
            "total_registros": len(items),
        }
        return {"items": items, "resumo": resumo}

    async def get_by_id(self, pesagem_id: UUID) -> PesagemModel:
        obj = await self.repo.get_by_id(pesagem_id)
        if not obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pesagem não encontrada.")
        return obj

    async def update(self, pesagem_id: UUID, schema: PesagemUpdate) -> PesagemModel:
        obj = await self.repo.get_by_id(pesagem_id)
        if not obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pesagem não encontrada.")
        for field, value in schema.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        await self.repo.session.commit()
        await self.repo.session.refresh(obj)
        return obj

    async def delete(self, pesagem_id: UUID) -> None:
        ok = await self.repo.delete(pesagem_id)
        if not ok:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pesagem não encontrada.")
