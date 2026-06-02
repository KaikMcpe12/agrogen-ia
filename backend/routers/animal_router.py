from fastapi import APIRouter, Depends, HTTPException, Query, status
from uuid import UUID
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

# Simulando o gerenciador de sessões (substitua pelo seu gerenciador real de banco)
# from database import get_async_session 

from schemas import AnimalCreate, AnimalUpdate, AnimalResponse
from backend.repositories.animal_repository import AnimalRepository
from backend.models.enums import EspecieAnimal

router = APIRouter(prefix="/animals", tags=["Animais"])

async def get_repository(session: AsyncSession = Depends(get_async_session)) -> AnimalRepository:
    return AnimalRepository(session)

@router.post("/", response_model=AnimalResponse, status_code=status.HTTP_201_CREATED)
async def create_animal(
    animal_in: AnimalCreate, 
    repo: AnimalRepository = Depends(get_repository)
):
    return await repo.create(animal_in)

@router.get("/", response_model=List[AnimalResponse])
async def list_animals(
    fazenda_id: Optional[UUID] = None,
    especie: Optional[EspecieAnimal] = None,
    incluir_inativos: bool = Query(False, description="Se True, traz também animais deletados logicamente"),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    repo: AnimalRepository = Depends(get_repository)
):
    return await repo.list_all(
        fazenda_id=fazenda_id, 
        especie=especie, 
        limit=limit, 
        offset=offset, 
        incluir_inativos=incluir_inativos
    )

@router.get("/{animal_id}", response_model=AnimalResponse)
async def get_animal(
    animal_id: UUID, 
    repo: AnimalRepository = Depends(get_repository)
):
    animal = await repo.get_by_id(animal_id)
    if not animal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Animal não encontrado ou inativo."
        )
    return animal

@router.put("/{animal_id}", response_model=AnimalResponse)
async def update_animal(
    animal_id: UUID, 
    animal_in: AnimalUpdate, 
    repo: AnimalRepository = Depends(get_repository)
):
    animal_atualizado = await repo.update(animal_id, animal_in)
    if not animal_atualizado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Animal não encontrado para atualização."
        )
    return animal_atualizado

@router.delete("/{animal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_animal(
    animal_id: UUID, 
    repo: AnimalRepository = Depends(get_repository)
):
    sucesso = await repo.soft_delete(animal_id)
    if not sucesso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Animal não encontrado ou já removido."
        )
    return None