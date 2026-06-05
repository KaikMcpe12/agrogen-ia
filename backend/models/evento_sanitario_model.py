from datetime import date, datetime
from uuid import UUID, uuid4
from sqlalchemy import String, Date, DateTime, Text, text, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ENUM as PG_ENUM
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base
from models.enums import TipoSanitario, ViaAdministracao


class EventoSanitarioModel(Base):
    __tablename__ = "eventos_sanitarios"

    evento_san_id:     Mapped[UUID]                  = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    animal_id:         Mapped[UUID]                  = mapped_column(PG_UUID(as_uuid=True), ForeignKey("animais.animal_id", ondelete="RESTRICT"), nullable=False)
    tipo:              Mapped[TipoSanitario]          = mapped_column(PG_ENUM(TipoSanitario, name="tipo_sanitario", create_type=False), nullable=False)
    produto:           Mapped[str]                   = mapped_column(String(120), nullable=False)
    principio_ativo:   Mapped[str | None]            = mapped_column(String(120), nullable=True)
    data_aplicacao:    Mapped[date]                  = mapped_column(Date, nullable=False)
    dose:              Mapped[str | None]            = mapped_column(String(60), nullable=True)
    via_administracao: Mapped[ViaAdministracao | None] = mapped_column(PG_ENUM(ViaAdministracao, name="via_administracao", create_type=False), nullable=True)
    lote_produto:      Mapped[str | None]            = mapped_column(String(60), nullable=True)
    proxima_dose:      Mapped[date | None]           = mapped_column(Date, nullable=True)
    responsavel_id:    Mapped[UUID]                  = mapped_column(PG_UUID(as_uuid=True), ForeignKey("usuarios.usuario_id", ondelete="RESTRICT"), nullable=False)
    observacoes:       Mapped[str | None]            = mapped_column(Text, nullable=True)
    created_at:        Mapped[datetime]              = mapped_column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))

    __table_args__ = (
        CheckConstraint("proxima_dose IS NULL OR proxima_dose > data_aplicacao", name="chk_san_proxima_dose"),
    )
