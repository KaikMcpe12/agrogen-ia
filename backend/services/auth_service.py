from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.security import hash_password, verify_password, create_access_token, create_refresh_token
from repositories.user_repository import UserRepository
from schemas.auth_schema import LoginRequest, RegisterRequest, TokenResponse
from models.user_model import User

_MAX_TENTATIVAS = 5
_BLOQUEIO_MINUTOS = 15

# ---------------------------------------------------------------------------
# TODO — MIGRATION PENDENTE
# Os métodos refresh(), logout() e solicitar_recuperacao()/resetar_senha()
# dependem das tabelas tb_refresh_tokens e tb_password_resets.
# Essas tabelas ainda NÃO foram criadas no banco de produção.
#
# Para ativar completamente:
#   1. Execute: alembic upgrade head   (cria tb_refresh_tokens)
#   2. Crie manualmente a migration para tb_password_resets (AUTH-05)
#   3. Mude _REFRESH_DB_ENABLED = True abaixo
#
# Enquanto isso, /refresh e /logout respondem com 503 explicativo,
# e /login funciona normalmente (retorna access_token válido).
# ---------------------------------------------------------------------------

_REFRESH_DB_ENABLED = False


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self.user_repo = UserRepository(session)
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

    # ── Refresh Token — requer tb_refresh_tokens ──────────────────────────────

    async def refresh(self, refresh_token: str) -> TokenResponse:
        if not _REFRESH_DB_ENABLED:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Refresh de token ainda não disponível. Faça login novamente para obter um novo access token. (Migration pendente: tb_refresh_tokens)",
            )

        # TODO: descomentar após rodar alembic upgrade head
        # from repositories.auth_repository import AuthRepository
        # auth_repo = AuthRepository(self.session)
        # obj = await auth_repo.get_refresh_token(refresh_token)
        # now = datetime.now(timezone.utc)
        # if not obj or obj.revogado or obj.expires_at.replace(tzinfo=timezone.utc) <= now:
        #     raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token inválido ou expirado.")
        # await auth_repo.revogar_refresh_token(refresh_token)
        # user = await self.user_repo.get_by_id(obj.usuario_id)
        # if not user or not user.ativo:
        #     raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário inativo.")
        # return await self._emitir_tokens(user)

    # ── Logout — client-side até migration rodar ──────────────────────────────

    async def logout(self, refresh_token: str | None, usuario_id: UUID) -> None:
        if not _REFRESH_DB_ENABLED:
            # Logout client-side: o frontend descarta o token. Sem revogação server-side.
            return

        # TODO: descomentar após rodar alembic upgrade head
        # from repositories.auth_repository import AuthRepository
        # auth_repo = AuthRepository(self.session)
        # if refresh_token:
        #     await auth_repo.revogar_refresh_token(refresh_token)

    # ── Recuperar Senha — requer tb_password_resets ───────────────────────────

    async def solicitar_recuperacao(self, email: str) -> None:
        # TODO: requer migration tb_password_resets + integração SMTP/SendGrid
        # Responde 200 por segurança (anti-enumeration) mas não faz nada ainda.
        return

    async def resetar_senha(self, token: str, nova_senha: str) -> None:
        # TODO: requer migration tb_password_resets
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Redefinição de senha ainda não disponível. (Migration pendente: tb_password_resets)",
        )

    # ── Helpers ───────────────────────────────────────────────────────────────

    async def _emitir_tokens(self, user: User) -> TokenResponse:
        payload = {
            "sub": str(user.usuario_id),
            "email": user.email,
            "perfil": user.perfil.value,
        }
        access_token = create_access_token(payload)

        # TODO: quando _REFRESH_DB_ENABLED = True, persistir refresh_token em tb_refresh_tokens
        refresh_token = create_refresh_token()

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_HOURS * 3600,
        )
