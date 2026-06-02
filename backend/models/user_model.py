from backend.models.enums import Perfil
from uuid import UUID
from datetime import datetime
from sqlalchemy import String, Boolean, Integer, DateTime, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ENUM as PG_ENUM
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from typing import Optional

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "usuarios"

    usuario_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )

    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=True)
    cpf: Mapped[str] = mapped_column(String(11), nullable=False, unique=True)
    telefone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    perfil: Mapped[Perfil] = mapped_column(
        PG_ENUM(Perfil, name="perfil", create_type=False), nullable=False
    )

    ativo: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=text("true")
    )
    tentativas_login: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )
    bloqueado_ate: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    ultimo_acesso: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )