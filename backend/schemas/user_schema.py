from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional
import re

from models.enums import Perfil


class UserBase(BaseModel):
    nome:     str    = Field(..., min_length=2, max_length=150)
    email:    str    = Field(..., max_length=255)
    cpf:      str    = Field(..., min_length=11, max_length=11)
    telefone: Optional[str] = Field(None, max_length=20)
    perfil:   Perfil

    @field_validator("cpf")
    @classmethod
    def validar_cpf(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("CPF deve conter apenas dígitos.")
        return v

    @field_validator("email")
    @classmethod
    def validar_email(cls, v: str) -> str:
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Email inválido.")
        return v.lower()


class UserCreate(UserBase):
    senha: str = Field(..., min_length=8, max_length=100)

    @field_validator("senha")
    @classmethod
    def validar_senha(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Senha deve conter ao menos uma letra maiúscula.")
        if not re.search(r"[0-9]", v):
            raise ValueError("Senha deve conter ao menos um número.")
        return v


class UserUpdate(BaseModel):
    nome:     Optional[str] = Field(None, min_length=2, max_length=150)
    telefone: Optional[str] = Field(None, max_length=20)
    perfil:   Optional[Perfil] = None


class UserResponse(UserBase):
    id:               UUID = Field(..., validation_alias="usuario_id")
    ativo:            bool
    tentativas_login: int
    ultimo_acesso:    Optional[datetime]
    created_at:       datetime
    updated_at:       datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)