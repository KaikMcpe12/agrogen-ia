from datetime import date, datetime
from decimal import Decimal
from uuid import UUID, uuid4
from sqlalchemy import String, Numeric, Date, DateTime, text, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ENUM as PG_ENUM
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base
from models.enums import EstagioPesagem


class PesagemModel(Base):
    __tablename__ = "pesagens"

    pesagem_id:    Mapped[UUID]           = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    animal_id:     Mapped[UUID]           = mapped_column(PG_UUID(as_uuid=True), ForeignKey("animais.animal_id", ondelete="RESTRICT"), nullable=False)
    data:          Mapped[date]           = mapped_column(Date, nullable=False)
    peso_kg:       Mapped[Decimal]        = mapped_column(Numeric(6, 2), nullable=False)
    estagio:       Mapped[EstagioPesagem] = mapped_column(PG_ENUM(EstagioPesagem, name="estagio_pesagem", create_type=False), nullable=False)
    gmd_calculado: Mapped[Decimal | None] = mapped_column(Numeric(5, 3), nullable=True)
    observacao:    Mapped[str | None]     = mapped_column(String(255), nullable=True)
    created_at:    Mapped[datetime]       = mapped_column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))

    __table_args__ = (
        UniqueConstraint("animal_id", "data", name="uq_pesagem_animal_data"),
        CheckConstraint("peso_kg > 0", name="chk_pesagem_peso"),
    )
