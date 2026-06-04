from uuid import UUID
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, exc
from fastapi import HTTPException, status

from models.animal_model import AnimalModel
from schemas import AnimalCreate, AnimalUpdate
from models.enums import EspecieAnimal

class AnimalRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, schema: AnimalCreate) -> AnimalModel:
        db_animal = AnimalModel(**schema.model_dump())
        self.session.add(db_animal)
        try:
            await self.session.commit()
            await self.session.refresh(db_animal)
            return db_animal
        except exc.DBAPIError as e:
            await self.session.rollback()
            # Tratamento amigável para Unique Constraints do Postgres
            if "uq_animal_codigo_fazenda" in str(e.orig):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Já existe um animal cadastrado com este código nesta fazenda."
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Erro de integridade no banco de dados: {str(e.orig)}"
            )

    async def get_by_id(self, animal_id: UUID, incluir_inativos: bool = False) -> Optional[AnimalModel]:
        stmt = select(AnimalModel).where(AnimalModel.animal_id == animal_id)
        if not incluir_inativos:
            stmt = stmt.where(AnimalModel.ativo == True)
        
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(
        self, 
        fazenda_id: Optional[UUID] = None, 
        especie: Optional[EspecieAnimal] = None, 
        limit: int = 10, 
        offset: int = 0,
        incluir_inativos: bool = False
    ) -> List[AnimalModel]:
        stmt = select(AnimalModel)
        filtros = []
        
        if not incluir_inativos:
            filtros.append(AnimalModel.ativo == True)
        if fazenda_id:
            filtros.append(AnimalModel.fazenda_id == fazenda_id)
        if especie:
            filtros.append(AnimalModel.especie == especie)
            
        if filtros:
            stmt = stmt.where(and_(*filtros))
            
        stmt = stmt.offset(offset).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update(self, animal_id: UUID, schema: AnimalUpdate) -> Optional[AnimalModel]:
        db_animal = await self.get_by_id(animal_id)
        if not db_animal:
            return None
            
        update_data = schema.model_dump(exclude_unset=True)
        
        # Validar consistência de atualização parcial sexo/num_partos
        novo_sexo = update_data.get("sexo", db_animal.sexo)
        novo_num_partos = update_data.get("num_partos", db_animal.num_partos)
        if novo_sexo == "MACHO" and novo_num_partos > 0:
            raise HTTPException(
                status_code=status.HTTP_420_METHOD_FAILURE,
                detail="Operação inválida: Machos não podem ter partos."
            )

        # Validar consistência de atualização parcial peso/espécie
        nova_especie = update_data.get("especie", db_animal.especie)
        novo_peso = update_data.get("peso_inicial_kg", db_animal.peso_inicial_kg)
        if nova_especie == EspecieAnimal.BOVINO and not (50 <= novo_peso <= 900):
            raise HTTPException(status_code=400, detail="Peso incompatível para BOVINO (50kg-900kg).")
        elif nova_especie == EspecieAnimal.OVINO and not (10 <= novo_peso <= 120):
            raise HTTPException(status_code=400, detail="Peso incompatível para OVINO (10kg-120kg).")
        elif nova_especie == EspecieAnimal.CAPRINO and not (8 <= novo_peso <= 100):
            raise HTTPException(status_code=400, detail="Peso incompatível para CAPRINO (8kg-100kg).")

        for key, value in update_data.items():
            setattr(db_animal, key, value)
            
        try:
            await self.session.commit()
            await self.session.refresh(db_animal)
            return db_animal
        except exc.DBAPIError as e:
            await self.session.rollback()
            if "uq_animal_codigo_fazenda" in str(e.orig):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Conflito: Já existe um animal com este código nesta fazenda."
                )
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e.orig))

    async def soft_delete(self, animal_id: UUID) -> bool:
        db_animal = await self.get_by_id(animal_id, incluir_inativos=True)
        if not db_animal:
            return False
        if not db_animal.ativo:
            return True
            
        db_animal.ativo = False
        await self.session.commit()
        return True