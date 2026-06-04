from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, exc
from fastapi import HTTPException, status

from models.fazenda_model import FazendaModel
from schemas.fazenda_schema import FazendaCreate, FazendaUpdate


class FazendaRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, schema: FazendaCreate) -> FazendaModel:
        db_fazenda = FazendaModel(**schema.model_dump())
        self.session.add(db_fazenda)
        try:
            await self.session.commit()
            await self.session.refresh(db_fazenda)
            return db_fazenda
        except exc.DBAPIError as e:
            await self.session.rollback()
            if "uq_fazenda_nome_produtor" in str(e.orig):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Já existe uma fazenda com este nome para este usuário."
                )
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e.orig))

    async def get_by_id(self, fazenda_id: UUID, incluir_inativos: bool = False) -> Optional[FazendaModel]:
        stmt = select(FazendaModel).where(FazendaModel.fazenda_id == fazenda_id)
        if not incluir_inativos:
            stmt = stmt.where(FazendaModel.ativo == True)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(
        self,
        usuario_id:       Optional[UUID] = None,
        estado:           Optional[str]  = None,
        incluir_inativos: bool = False,
        limit:  int = 10,
        offset: int = 0,
    ) -> list[FazendaModel]:
        filtros = []
        if not incluir_inativos:
            filtros.append(FazendaModel.ativo == True)
        if usuario_id:
            filtros.append(FazendaModel.usuario_id == usuario_id)
        if estado:
            filtros.append(FazendaModel.estado == estado.upper())

        stmt = select(FazendaModel)
        if filtros:
            stmt = stmt.where(and_(*filtros))
        stmt = stmt.offset(offset).limit(limit)

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update(self, fazenda_id: UUID, schema: FazendaUpdate) -> Optional[FazendaModel]:
        db_fazenda = await self.get_by_id(fazenda_id)
        if not db_fazenda:
            return None
        for key, value in schema.model_dump(exclude_unset=True).items():
            setattr(db_fazenda, key, value)
        try:
            await self.session.commit()
            await self.session.refresh(db_fazenda)
            return db_fazenda
        except exc.DBAPIError as e:
            await self.session.rollback()
            if "uq_fazenda_nome_produtor" in str(e.orig):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Conflito: já existe uma fazenda com este nome para este usuário."
                )
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e.orig))

    async def soft_delete(self, fazenda_id: UUID) -> bool:
        db_fazenda = await self.get_by_id(fazenda_id)
        if not db_fazenda:
            return False
        db_fazenda.ativo = False
        await self.session.commit()
        return True