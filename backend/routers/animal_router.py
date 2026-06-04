from fastapi import APIRouter, Depends, Query, status
from uuid import UUID
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.animal_service import AnimalService
from schemas import AnimalCreate, AnimalUpdate, AnimalResponse
from models.enums import EspecieAnimal

router = APIRouter(prefix="/animals", tags=["Animais"])


async def get_service(session: AsyncSession = Depends(get_db)) -> AnimalService:
    return AnimalService(session)


@router.post("/", response_model=AnimalResponse, status_code=status.HTTP_201_CREATED)
async def create_animal(
    animal_in: AnimalCreate,
    service: AnimalService = Depends(get_service)
):
    return await service.create(animal_in)


@router.get("/", response_model=List[AnimalResponse])
async def list_animals(
    fazenda_id: Optional[UUID] = None,
    especie: Optional[EspecieAnimal] = None,
    incluir_inativos: bool = Query(False, description="Se True, traz também animais deletados logicamente"),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    service: AnimalService = Depends(get_service)
):
    return await service.list_all(
        fazenda_id=fazenda_id,
        especie=especie,
        limit=limit,
        offset=offset,
        incluir_inativos=incluir_inativos
    )


@router.get("/{animal_id}", response_model=AnimalResponse)
async def get_animal(
    animal_id: UUID,
    service: AnimalService = Depends(get_service)
):
    return await service.get_by_id(animal_id)


@router.put("/{animal_id}", response_model=AnimalResponse)
async def update_animal(
    animal_id: UUID,
    animal_in: AnimalUpdate,
    service: AnimalService = Depends(get_service)
):
    return await service.update(animal_id, animal_in)


@router.delete("/{animal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_animal(
    animal_id: UUID,
    service: AnimalService = Depends(get_service)
):
    await service.soft_delete(animal_id)