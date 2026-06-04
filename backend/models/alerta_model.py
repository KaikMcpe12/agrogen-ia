from datetime import date, datetime
from uuid import UUID, uuid4
from sqlalchemy import String, Boolean, Date, DateTime, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ENUM as PG_ENUM
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base
from models.enums import TipoAlerta, PrioridadeAlerta


class AlertaModel(Base):
    __tablename__ = "alertas"

    alerta_id:      Mapped[UUID]             = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    animal_id:      Mapped[UUID | None]      = mapped_column(PG_UUID(as_uuid=True), ForeignKey("animais.animal_id", ondelete="CASCADE"), nullable=True)
    inseminacao_id: Mapped[UUID | None]      = mapped_column(PG_UUID(as_uuid=True), ForeignKey("inseminacoes.inseminacao_id", ondelete="CASCADE"), nullable=True)
    sanitario_id:   Mapped[UUID | None]      = mapped_column(PG_UUID(as_uuid=True), ForeignKey("eventos_sanitarios.evento_san_id", ondelete="CASCADE"), nullable=True)
    tipo:           Mapped[TipoAlerta]       = mapped_column(PG_ENUM(TipoAlerta, name="tipo_alerta", create_type=False), nullable=False)
    mensagem:       Mapped[str]              = mapped_column(String(500), nullable=False)
    data_disparo:   Mapped[date]             = mapped_column(Date, nullable=False)
    prioridade:     Mapped[PrioridadeAlerta] = mapped_column(PG_ENUM(PrioridadeAlerta, name="prioridade_alerta", create_type=False), nullable=False, server_default="MEDIA")
    lido:           Mapped[bool]             = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    resolvido:      Mapped[bool]             = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    created_at:     Mapped[datetime]         = mapped_column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
