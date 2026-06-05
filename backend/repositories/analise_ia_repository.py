from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, exc
from fastapi import HTTPException, status

from models.analise_ia_model import AnaliseIAModel
from schemas.analise_ia_schema import AnaliseIACreate, AnaliseIAUpdate


class AnaliseIARepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, schema: AnaliseIACreate) -> AnaliseIAModel:
        db_analise = AnaliseIAModel(**schema.model_dump())
        self.session.add(db_analise)
        try:
            await self.session.commit()
            await self.session.refresh(db_analise)
            return db_analise
        except exc.DBAPIError as e:
            await self.session.rollback()
            if "fk_analise_animal" in str(e.orig):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Animal não encontrado."
                )
            if "fk_analise_tecnico" in str(e.orig):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Técnico não encontrado."
                )
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e.orig))

    async def get_by_id(self, analise_id: UUID) -> Optional[AnaliseIAModel]:
        stmt = select(AnaliseIAModel).where(AnaliseIAModel.analise_id == analise_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(
        self,
        animal_id:  Optional[UUID] = None,
        tecnico_id: Optional[UUID] = None,
        limit:  int = 10,
        offset: int = 0,
    ) -> list[AnaliseIAModel]:
        filtros = []
        if animal_id:
            filtros.append(AnaliseIAModel.animal_id == animal_id)
        if tecnico_id:
            filtros.append(AnaliseIAModel.tecnico_id == tecnico_id)

        stmt = select(AnaliseIAModel)
        if filtros:
            stmt = stmt.where(and_(*filtros))
        stmt = stmt.order_by(AnaliseIAModel.created_at.desc()).offset(offset).limit(limit)

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update(self, analise_id: UUID, schema: AnaliseIAUpdate) -> Optional[AnaliseIAModel]:
        db_analise = await self.get_by_id(analise_id)
        if not db_analise:
            return None
        for key, value in schema.model_dump(exclude_unset=True).items():
            setattr(db_analise, key, value)
        try:
            await self.session.commit()
            await self.session.refresh(db_analise)
            return db_analise
        except exc.DBAPIError as e:
            await self.session.rollback()
            if "fk_analise_tecnico" in str(e.orig):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Técnico não encontrado."
                )
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e.orig))

    async def delete(self, analise_id: UUID) -> bool:
        db_analise = await self.get_by_id(analise_id)
        if not db_analise:
            return False
        await self.session.delete(db_analise)
        await self.session.commit()
        return True