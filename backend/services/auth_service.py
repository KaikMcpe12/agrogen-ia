from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.security import hash_password, verify_password, create_access_token, create_refresh_token
from repositories.user_repository import UserRepository
from repositories.auth_repository import AuthRepository
from schemas.auth_schema import LoginRequest, RegisterRequest, TokenResponse
from models.user_model import User

_MAX_TENTATIVAS = 5
_BLOQUEIO_MINUTOS = 15


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self.user_repo = UserRepository(session)
        self.auth_repo = AuthRepository(session)
        self.session = session

    # ── Login ─────────────────────────────────────────────────────────────────

    async def login(self, data: LoginRequest) -> TokenResponse:
        user = await self.user_repo.get_by_email_for_auth(data.email)

        if not user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Credenciais inválidas.")

        if not user.ativo:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuário inativo.")

        now = datetime.now(timezone.utc)

        if user.bloqueado_ate and user.bloqueado_ate.replace(tzinfo=timezone.utc) > now:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Conta bloqueada por tentativas excessivas. Tente novamente após {user.bloqueado_ate.isoformat()}.",
            )

        if not verify_password(data.senha, user.senha_hash):
            user.tentativas_login += 1
            if user.tentativas_login >= _MAX_TENTATIVAS:
                user.bloqueado_ate = now + timedelta(minutes=_BLOQUEIO_MINUTOS)
                user.tentativas_login = 0
            await self.session.commit()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Credenciais inválidas.")

        user.tentativas_login = 0
        user.bloqueado_ate = None
        user.ultimo_acesso = now
        await self.session.commit()

        return await self._emitir_tokens(user)

    # ── Register ──────────────────────────────────────────────────────────────

    async def register(self, data: RegisterRequest) -> dict:
        from models.enums import Perfil
        from schemas.user_schema import UserCreate

        existente_email = await self.user_repo.get_by_email(data.email)
        if existente_email:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email já cadastrado.")

        try:
            perfil = Perfil(data.perfil.upper())
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Perfil inválido: {data.perfil}.")

        schema = UserCreate(
            nome=data.nome,
            email=data.email,
            senha=data.senha,
            cpf=data.cpf,
            telefone=data.telefone,
            perfil=perfil,
        )
        user = await self.user_repo.create(schema, senha_hash=hash_password(data.senha))
        return {"usuario_id": str(user.usuario_id), "email": user.email}

    # ── Refresh Token ─────────────────────────────────────────────────────────

    async def refresh(self, refresh_token: str) -> TokenResponse:
        obj = await self.auth_repo.get_refresh_token(refresh_token)
        now = datetime.now(timezone.utc)

        if not obj or obj.revogado or obj.expires_at.replace(tzinfo=timezone.utc) <= now:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token inválido ou expirado.")

        await self.auth_repo.revogar_refresh_token(refresh_token)

        user = await self.user_repo.get_by_id(obj.usuario_id)
        if not user or not user.ativo:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário inativo.")

        return await self._emitir_tokens(user)

    # ── Logout ────────────────────────────────────────────────────────────────

    async def logout(self, refresh_token: str | None, usuario_id: UUID) -> None:
        if refresh_token:
            await self.auth_repo.revogar_refresh_token(refresh_token)

    # ── Recuperar Senha ───────────────────────────────────────────────────────

    async def solicitar_recuperacao(self, email: str) -> None:
        """Sempre retorna 200 — não revela se o email existe (anti-enumeration)."""
        user = await self.user_repo.get_by_email(email)
        if not user:
            return

        token = create_refresh_token()
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        await self.auth_repo.save_reset_token(user.usuario_id, token, expires_at)
        # TODO: enviar email com link de reset (integração SendGrid/SMTP)

    async def resetar_senha(self, token: str, nova_senha: str) -> None:
        obj = await self.auth_repo.get_reset_token(token)
        now = datetime.now(timezone.utc)

        if not obj or obj.usado or obj.expires_at.replace(tzinfo=timezone.utc) <= now:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token inválido ou expirado.")

        user = await self.user_repo.get_by_id(obj.usuario_id, incluir_inativos=True)
        if not user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token inválido.")

        user.senha_hash = hash_password(nova_senha)
        user.tentativas_login = 0
        user.bloqueado_ate = None
        await self.auth_repo.marcar_reset_usado(obj)
        await self.auth_repo.revogar_todos_refresh_tokens(user.usuario_id)
        await self.session.commit()

    # ── Helpers ───────────────────────────────────────────────────────────────

    async def _emitir_tokens(self, user: User) -> TokenResponse:
        payload = {
            "sub": str(user.usuario_id),
            "email": user.email,
            "perfil": user.perfil.value,
        }
        access_token = create_access_token(payload)
        refresh_token = create_refresh_token()

        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        await self.auth_repo.save_refresh_token(user.usuario_id, refresh_token, expires_at)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_HOURS * 3600,
        )
