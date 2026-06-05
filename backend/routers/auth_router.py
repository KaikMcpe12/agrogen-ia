from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_current_user
from models.user_model import User
from services.auth_service import AuthService
from schemas.auth_schema import (
    LoginRequest, RegisterRequest,
    RefreshRequest, LogoutRequest,
    RecuperarSenhaRequest, ResetarSenhaRequest,
)

router = APIRouter(prefix="/auth", tags=["Autenticação"])


def _service(session: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(session)


@router.post("/login")
async def login(data: LoginRequest, service: AuthService = Depends(_service)):
    return {"success": True, "data": await service.login(data)}


@router.post("/registro", status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, service: AuthService = Depends(_service)):
    result = await service.register(data)
    return {"success": True, "data": result}


@router.post("/refresh")
async def refresh(data: RefreshRequest, service: AuthService = Depends(_service)):
    return {"success": True, "data": await service.refresh(data.refresh_token)}


@router.post("/logout")
async def logout(
    data: LogoutRequest,
    current_user: User = Depends(get_current_user),
    service: AuthService = Depends(_service),
):
    await service.logout(data.refresh_token, current_user.usuario_id)
    return {"success": True, "data": {"mensagem": "Logout realizado com sucesso."}}


@router.post("/recuperar-senha")
async def recuperar_senha(data: RecuperarSenhaRequest, service: AuthService = Depends(_service)):
    await service.solicitar_recuperacao(data.email)
    return {"success": True, "data": {"mensagem": "Se o e-mail estiver cadastrado, você receberá as instruções em breve."}}


@router.post("/redefinir-senha")
async def resetar_senha(data: ResetarSenhaRequest, service: AuthService = Depends(_service)):
    await service.resetar_senha(data.token, data.nova_senha)
    return {"success": True, "data": {"mensagem": "Senha redefinida com sucesso. Faça login com a nova senha."}}
