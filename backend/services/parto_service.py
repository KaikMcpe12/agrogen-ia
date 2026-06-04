from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from models.parto_model import PartoModel
from models.enums import SexoAnimal, StatusAnimal, ResultadoInseminacao
from repositories.parto_repository import PartoRepository
from repositories.animal_repository import AnimalRepository
from repositories.inseminacao_repository import InseminacaoRepository
from schemas.parto_schema import PartoCreate


class PartoService:
    def __init__(self, session: AsyncSession) -> None:
        self.repo      = PartoRepository(session)
        self.animal_repo = AnimalRepository(session)
        self.ins_repo  = InseminacaoRepository(session)
        self.session   = session

    async def create(self, animal_id: UUID, schema: PartoCreate) -> dict:
        animal = await self.animal_repo.get_by_id(animal_id)
        if not animal:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal não encontrado.")

        if animal.sexo != SexoAnimal.FEMEA:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Apenas fêmeas podem ter partos registrados.")

        # Calcula IEP antes de atualizar data_ultimo_parto
        iep_dias: int | None = None
        if animal.data_ultimo_parto:
            iep_dias = (schema.data_parto - animal.data_ultimo_parto).days

        # Atualiza animal
        animal.num_partos += 1
        animal.data_ultimo_parto = schema.data_parto
        if schema.houve_obito_matriz:
            animal.ativo   = False
            animal.status  = StatusAnimal.DESCARTADA
        elif animal.status == StatusAnimal.PRENHA:
            animal.status = StatusAnimal.ATIVA

        payload = schema.model_dump()
        payload["animal_id"] = animal_id
        parto = await self.repo.create(payload)

        # Atualiza resultado da inseminação vinculada
        if schema.inseminacao_id:
            ins = await self.ins_repo.get_by_id(schema.inseminacao_id)
            if ins:
                await self.ins_repo.update(schema.inseminacao_id, {"resultado": ResultadoInseminacao.PRENHA})

        await self.session.commit()

        return {
            "parto": parto,
            "iep_dias": iep_dias,
            "animal_num_partos_atualizado": animal.num_partos,
        }

    async def list_by_animal(self, animal_id: UUID, **kwargs) -> list[dict]:
        animal = await self.animal_repo.get_by_id(animal_id)
        if not animal:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal não encontrado.")
        partos = await self.repo.list_by_animal(animal_id, **kwargs)

        # Calcula IEP para cada par de partos consecutivos
        resultado = []
        for i, parto in enumerate(partos):
            iep = None
            if i + 1 < len(partos):
                iep = (parto.data_parto - partos[i + 1].data_parto).days
            resultado.append({"parto": parto, "iep_dias": iep})
        return resultado

    async def get_by_id(self, parto_id: UUID) -> PartoModel:
        obj = await self.repo.get_by_id(parto_id)
        if not obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parto não encontrado.")
        return obj
