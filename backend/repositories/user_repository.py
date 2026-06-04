from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, exc
from fastapi import HTTPException, status

from models.user_model import User
from schemas.user_schema import UserCreate, UserUpdate


class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, schema: UserCreate, senha_hash: str) -> User:
        data = schema.model_dump(exclude={"senha"})
        db_user = User(**data, senha_hash=senha_hash)
        self.session.add(db_user)
        try:
            await self.session.commit()
            await self.session.refresh(db_user)
            return db_user
        except exc.DBAPIError as e:
            await self.session.rollback()
            if "uq_usuario_email" in str(e.orig):
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email já cadastrado.")
            if "uq_usuario_cpf" in str(e.orig):
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="CPF já cadastrado.")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e.orig))

    async def get_by_id(self, usuario_id: UUID, incluir_inativos: bool = False) -> Optional[User]:
        stmt = select(User).where(User.usuario_id == usuario_id)
        if not incluir_inativos:
            stmt = stmt.where(User.ativo == True)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def list_all(
        self,
        perfil: Optional[str] = None,
        limit:  int = 10,
        offset: int = 0,
        incluir_inativos: bool = False,
    ) -> list[User]:
        stmt = select(User)
        filtros = []
        if not incluir_inativos:
            filtros.append(User.ativo == True)
        if perfil:
            filtros.append(User.perfil == perfil)
        if filtros:
            from sqlalchemy import and_
            stmt = stmt.where(and_(*filtros))
        stmt = stmt.offset(offset).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update(self, usuario_id: UUID, schema: UserUpdate) -> Optional[User]:
        db_user = await self.get_by_id(usuario_id)
        if not db_user:
            return None
        for key, value in schema.model_dump(exclude_unset=True).items():
            setattr(db_user, key, value)
        await self.session.commit()
        await self.session.refresh(db_user)
        return db_user

    async def soft_delete(self, usuario_id: UUID) -> bool:
        db_user = await self.get_by_id(usuario_id)
        if not db_user:
            return False
        db_user.ativo = False
        await self.session.commit()
        return True