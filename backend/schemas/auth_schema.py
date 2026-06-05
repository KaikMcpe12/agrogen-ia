from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from uuid import UUID


class LoginRequest(BaseModel):
    email: str
    senha: str


class RegisterRequest(BaseModel):
    nome: str
    email: str
    senha: str
    confirma_senha: Optional[str] = None
    cpf: str
    telefone: Optional[str] = None
    perfil: str = "PRODUTOR"

    @field_validator("cpf")
    @classmethod
    def cpf_somente_digitos(cls, v: str) -> str:
        digitos = v.replace(".", "").replace("-", "")
        if not digitos.isdigit() or len(digitos) != 11:
            raise ValueError("CPF deve conter exatamente 11 dígitos numéricos.")
        return digitos

    @field_validator("senha")
    @classmethod
    def senha_forte(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Senha deve ter no mínimo 8 caracteres.")
        if not any(c.isupper() for c in v):
            raise ValueError("Senha deve conter ao menos uma letra maiúscula.")
        if not any(c.isdigit() for c in v):
            raise ValueError("Senha deve conter ao menos um número.")
        return v

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None


class RecuperarSenhaRequest(BaseModel):
    email: str


class ResetarSenhaRequest(BaseModel):
    token: str
    nova_senha: str
    confirma_senha: str

    @field_validator("nova_senha")
    @classmethod
    def senha_forte(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Senha deve ter no mínimo 8 caracteres.")
        if not any(c.isupper() for c in v):
            raise ValueError("Senha deve conter ao menos uma letra maiúscula.")
        if not any(c.isdigit() for c in v):
            raise ValueError("Senha deve conter ao menos um número.")
        return v

    @field_validator("confirma_senha")
    @classmethod
    def senhas_conferem(cls, v: str, info) -> str:
        if "nova_senha" in info.data and v != info.data["nova_senha"]:
            raise ValueError("Senha e confirmação não conferem.")
        return v
