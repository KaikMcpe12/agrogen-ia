from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, field_validator, ConfigDict
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_current_user
from core.security import verify_password, hash_password
from models.user_model import User
from repositories.user_repository import UserRepository
from repositories.fazenda_repository import FazendaRepository

router = APIRouter(prefix="/usuarios", tags=["Perfil do Usuário"])


# ── Schemas locais ────────────────────────────────────────────────────────────

class FazendaResumida(BaseModel):
    fazenda_id: UUID
    nome: str
    municipio: str
    estado: str
    model_config = ConfigDict(from_attributes=True)


class MeResponse(BaseModel):
    usuario_id: UUID
    nome: str
    email: str
    cpf: str
    telefone: Optional[str]
    perfil: str
    ativo: bool
    fazendas: list[FazendaResumida]
    ultimo_acesso: Optional[datetime]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class MeUpdateRequest(BaseModel):
    nome: Optional[str] = None
    telefone: Optional[str] = None
    senha_atual: Optional[str] = None
    nova_senha: Optional[str] = None
    confirma_nova_senha: Optional[str] = None

    @field_validator("nome")
    @classmethod
    def nome_minimo(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v.strip()) < 3:
            raise ValueError("Nome deve ter ao menos 3 caracteres.")
        return v


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/me")
async def get_me(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    fazenda_repo = FazendaRepository(session)
    fazendas = await fazenda_repo.list_all(usuario_id=current_user.usuario_id, limit=100)

    data = MeResponse(
        usuario_id=current_user.usuario_id,
        nome=current_user.nome,
        email=current_user.email,
        cpf="***" + current_user.cpf[-2:],
        telefone=current_user.telefone,
        perfil=current_user.perfil.value,
        ativo=current_user.ativo,
        fazendas=[FazendaResumida.model_validate(f) for f in fazendas],
        ultimo_acesso=current_user.ultimo_acesso,
        created_at=current_user.created_at,
    )
    payload = data.model_dump()
    payload["id"] = str(current_user.usuario_id)
    return {"success": True, "data": payload}


@router.patch("/me")
async def update_me(
    body: MeUpdateRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    from fastapi import HTTPException, status as http_status

    if body.nova_senha:
        if not body.senha_atual:
            raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail="Informe a senha atual para alterá-la.")
        if not verify_password(body.senha_atual, current_user.senha_hash):
            raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail="Senha atual incorreta.")
        if body.nova_senha != body.confirma_nova_senha:
            raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail="Nova senha e confirmação não conferem.")
        current_user.senha_hash = hash_password(body.nova_senha)

    if body.nome is not None:
        current_user.nome = body.nome
    if body.telefone is not None:
        current_user.telefone = body.telefone

    await session.commit()
    await session.refresh(current_user)
    return {"success": True, "data": {"usuario_id": str(current_user.usuario_id), "nome": current_user.nome, "updated_at": current_user.updated_at.isoformat()}}


@router.post("/me/exportacao-lgpd")
async def exportacao_lgpd(
    formato: str = Query("json", pattern="^(json|csv)$"),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """
    USR-03 — Exportação LGPD (Art. 18).
    Versão MVP: retorna dados sincronamente em JSON.
    Produção: substituir por job assíncrono com envio por e-mail.
    """
    from repositories.fazenda_repository import FazendaRepository
    from repositories.animal_repository import AnimalRepository

    fazenda_repo = FazendaRepository(session)
    animal_repo = AnimalRepository(session)

    fazendas = await fazenda_repo.list_all(usuario_id=current_user.usuario_id, limit=500)
    todos_animais = []
    for faz in fazendas:
        animais = await animal_repo.list_all(fazenda_id=faz.fazenda_id, limit=500, incluir_inativos=True)
        todos_animais.extend(animais)

    payload = {
        "usuario": {
            "usuario_id": str(current_user.usuario_id),
            "nome": current_user.nome,
            "email": current_user.email,
            "cpf": current_user.cpf,
            "telefone": current_user.telefone,
            "perfil": current_user.perfil.value,
            "created_at": current_user.created_at.isoformat(),
        },
        "fazendas": [
            {"fazenda_id": str(f.fazenda_id), "nome": f.nome, "municipio": f.municipio, "estado": f.estado}
            for f in fazendas
        ],
        "animais": [
            {"animal_id": str(a.animal_id), "codigo": a.codigo, "nome": a.nome, "especie": a.especie.value}
            for a in todos_animais
        ],
    }

    return {"success": True, "data": payload}
