from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, Boolean, Integer, DateTime, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ENUM as PG_ENUM
from sqlalchemy.orm import Mapped, mapped_column, DeclarativeBase
from sqlalchemy.sql import func

from models.enums import Perfil

class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "usuarios"

    usuario_id:       Mapped[UUID]          = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    nome:             Mapped[str]            = mapped_column(String(150), nullable=False)
    email:            Mapped[str]            = mapped_column(String(255), nullable=False, unique=True)
    senha_hash:       Mapped[str]            = mapped_column(String(255), nullable=False)
    cpf:              Mapped[str]            = mapped_column(String(11), nullable=False, unique=True)
    telefone:         Mapped[str | None]     = mapped_column(String(20), nullable=True)
    perfil:           Mapped[Perfil]         = mapped_column(PG_ENUM(Perfil, name="perfil", create_type=False), nullable=False)
    ativo:            Mapped[bool]           = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    tentativas_login: Mapped[int]            = mapped_column(Integer, nullable=False, default=0, server_default="0")
    bloqueado_ate:    Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    ultimo_acesso:    Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at:       Mapped[datetime]        = mapped_column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    updated_at:       Mapped[datetime]        = mapped_column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"), onupdate=func.now())