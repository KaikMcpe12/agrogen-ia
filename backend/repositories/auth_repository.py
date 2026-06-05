from datetime import datetime, timezone
from uuid import UUID
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.refresh_token_model import RefreshTokenModel
from models.password_reset_model import PasswordResetModel


class AuthRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # ── Refresh Tokens ────────────────────────────────────────────────────────

    async def save_refresh_token(self, usuario_id: UUID, token: str, expires_at: datetime) -> RefreshTokenModel:
        obj = RefreshTokenModel(usuario_id=usuario_id, token=token, expires_at=expires_at)
        self.session.add(obj)
        await self.session.commit()
        return obj

    async def get_refresh_token(self, token: str) -> Optional[RefreshTokenModel]:
        result = await self.session.execute(
            select(RefreshTokenModel).where(RefreshTokenModel.token == token)
        )
        return result.scalar_one_or_none()

    async def revogar_refresh_token(self, token: str) -> None:
        obj = await self.get_refresh_token(token)
        if obj:
            obj.revogado = True
            await self.session.commit()

    async def revogar_todos_refresh_tokens(self, usuario_id: UUID) -> None:
        from sqlalchemy import update
        stmt = (
            update(RefreshTokenModel)
            .where(RefreshTokenModel.usuario_id == usuario_id, RefreshTokenModel.revogado == False)
            .values(revogado=True)
        )
        await self.session.execute(stmt)
        await self.session.commit()

    # ── Password Resets ───────────────────────────────────────────────────────

    async def save_reset_token(self, usuario_id: UUID, token: str, expires_at: datetime) -> PasswordResetModel:
        obj = PasswordResetModel(usuario_id=usuario_id, token=token, expires_at=expires_at)
        self.session.add(obj)
        await self.session.commit()
        return obj

    async def get_reset_token(self, token: str) -> Optional[PasswordResetModel]:
        result = await self.session.execute(
            select(PasswordResetModel).where(PasswordResetModel.token == token)
        )
        return result.scalar_one_or_none()

    async def marcar_reset_usado(self, reset: PasswordResetModel) -> None:
        reset.usado = True
        reset.usado_em = datetime.now(timezone.utc)
        await self.session.commit()
