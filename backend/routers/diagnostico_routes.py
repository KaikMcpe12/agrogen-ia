from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.database import get_db
from models.diagnostico_model import Diagnostico
from schemas.diagnostico_schema import DiagnosticoCreate

router = APIRouter(
    prefix="/diagnosticos",
    tags=["Diagnósticos"]
)

# 🔵 CREATE (POST)
@router.post("/")
async def create_diagnostico(
    diagnostico: DiagnosticoCreate,
    db: AsyncSession = Depends(get_db)
):
    novo = Diagnostico(**diagnostico.dict())

    db.add(novo)
    await db.commit()
    await db.refresh(novo)

    return novo

@router.get("/")
async def get_diagnosticos(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Diagnostico))
    return result.scalars().all()

@router.put("/{diagnostico_id}")
async def update_diagnostico(
    diagnostico_id: str,
    dados: DiagnosticoCreate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Diagnostico).where(Diagnostico.id == diagnostico_id)
    )
    diagnostico = result.scalar_one_or_none()

    if not diagnostico:
        raise HTTPException(status_code=404, detail="Diagnóstico não encontrado")

    for key, value in dados.dict().items():
        setattr(diagnostico, key, value)

    await db.commit()
    await db.refresh(diagnostico)

    return diagnostico


# 🔴 DELETE
@router.delete("/{diagnostico_id}")
async def delete_diagnostico(
    diagnostico_id: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Diagnostico).where(Diagnostico.id == diagnostico_id)
    )
    diagnostico = result.scalar_one_or_none()

    if not diagnostico:
        raise HTTPException(status_code=404, detail="Diagnóstico não encontrado")

    await db.delete(diagnostico)
    await db.commit()

    return {"msg": "Diagnóstico deletado com sucesso"}