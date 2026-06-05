from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, SmallInteger, Boolean, DateTime, Text, text, UniqueConstraint, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ENUM as PG_ENUM
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base
from models.enums import EspecieAnimal


class ProtocoloHormonalModel(Base):
    __tablename__ = "protocolo_hormonal"

    protocolo_id:  Mapped[UUID]          = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    nome:          Mapped[str]           = mapped_column(String(100), nullable=False)
    especie:       Mapped[EspecieAnimal] = mapped_column(PG_ENUM(EspecieAnimal, name="especie_animal", create_type=False), nullable=False)
    descricao:     Mapped[str | None]    = mapped_column(Text, nullable=True)
    duracao_dias:  Mapped[int]           = mapped_column(SmallInteger, nullable=False)
    hormonios:     Mapped[str | None]    = mapped_column(String(255), nullable=True)
    observacoes:   Mapped[str | None]    = mapped_column(Text, nullable=True)
    ativo:         Mapped[bool]          = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    created_at:    Mapped[datetime]      = mapped_column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))

    __table_args__ = (
        UniqueConstraint("nome", "especie", name="uq_protocolo_nome_especie"),
        CheckConstraint("duracao_dias > 0", name="chk_protocolo_duracao"),
    )
