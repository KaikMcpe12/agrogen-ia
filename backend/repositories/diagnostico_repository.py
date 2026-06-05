from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, exc
from fastapi import HTTPException, status

from models.diagnostico_model import DiagnosticoModel
from schemas.diagnostico_schema import DiagnosticoCreate, DiagnosticoUpdate


class DiagnosticoRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, schema: DiagnosticoCreate) -> DiagnosticoModel:
        db_diag = DiagnosticoModel(**schema.model_dump())
        self.session.add(db_diag)
        try:
            await self.session.commit()
            await self.session.refresh(db_diag)
            return db_diag
        except exc.DBAPIError as e:
            await self.session.rollback()
            if "uq_diagnostico_inseminacao" in str(e.orig):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Já existe um diagnóstico para esta inseminação."
                )
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e.orig))

    async def get_by_id(self, diagnostico_id: UUID) -> Optional[DiagnosticoModel]:
        result = await self.session.execute(
            select(DiagnosticoModel).where(DiagnosticoModel.diagnostico_id == diagnostico_id)
        )
        return result.scalar_one_or_none()

    async def list_by_animal(
        self,
        animal_id: Optional[UUID] = None,
        resultado: Optional[str]  = None,
        limit:  int = 10,
        offset: int = 0,
    ) -> list[DiagnosticoModel]:
        filtros = []
        if animal_id:
            filtros.append(DiagnosticoModel.animal_id == animal_id)
        if resultado:
            filtros.append(DiagnosticoModel.resultado == resultado)

        stmt = select(DiagnosticoModel)
        if filtros:
            stmt = stmt.where(and_(*filtros))
        stmt = stmt.offset(offset).limit(limit)

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update(self, diagnostico_id: UUID, schema: DiagnosticoUpdate) -> Optional[DiagnosticoModel]:
        db_diag = await self.get_by_id(diagnostico_id)
        if not db_diag:
            return None
        for key, value in schema.model_dump(exclude_unset=True).items():
            setattr(db_diag, key, value)
        try:
            await self.session.commit()
            await self.session.refresh(db_diag)
            return db_diag
        except exc.DBAPIError as e:
            await self.session.rollback()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e.orig))

    async def delete(self, diagnostico_id: UUID) -> bool:
        db_diag = await self.get_by_id(diagnostico_id)
        if not db_diag:
            return False
        await self.session.delete(db_diag)
        await self.session.commit()
        return True