from uuid import UUID
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import hashlib

from repositories.user_repository import UserRepository
from schemas.user_schema import UserCreate, UserUpdate
from models.user_model import User
from models.enums import Perfil


def _hash_senha(senha: str) -> str:
    return hashlib.sha256(senha.encode()).hexdigest()


class UserService:
    def __init__(self, session: AsyncSession):
        self.repo = UserRepository(session)

    async def create(self, schema: UserCreate) -> User:
        existente = await self.repo.get_by_email(schema.email)
        if existente:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email já cadastrado.")
        return await self.repo.create(schema, senha_hash=_hash_senha(schema.senha))

    async def get_by_id(self, usuario_id: UUID) -> User:
        user = await self.repo.get_by_id(usuario_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")
        return user

    async def list_all(self, **kwargs) -> list[User]:
        return await self.repo.list_all(**kwargs)

    async def update(self, usuario_id: UUID, schema: UserUpdate) -> User:
        user = await self.repo.update(usuario_id, schema)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")
        return user

    async def soft_delete(self, usuario_id: UUID) -> None:
        sucesso = await self.repo.soft_delete(usuario_id)
        if not sucesso:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado ou já inativo.")