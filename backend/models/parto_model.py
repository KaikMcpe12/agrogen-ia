from datetime import date, datetime
from decimal import Decimal
from uuid import UUID, uuid4
from sqlalchemy import SmallInteger, Boolean, Date, Numeric, DateTime, Text, text, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ENUM as PG_ENUM
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base
from models.enums import TipoParto


class PartoModel(Base):
    __tablename__ = "partos"

    parto_id:            Mapped[UUID]         = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    animal_id:           Mapped[UUID]         = mapped_column(PG_UUID(as_uuid=True), ForeignKey("animais.animal_id", ondelete="RESTRICT"), nullable=False)
    inseminacao_id:      Mapped[UUID | None]  = mapped_column(PG_UUID(as_uuid=True), ForeignKey("inseminacoes.inseminacao_id", ondelete="SET NULL"), nullable=True, unique=True)
    data_parto:          Mapped[date]         = mapped_column(Date, nullable=False)
    tipo_parto:          Mapped[TipoParto]    = mapped_column(PG_ENUM(TipoParto, name="tipo_parto", create_type=False), nullable=False)
    num_crias:           Mapped[int]          = mapped_column(SmallInteger, nullable=False)
    num_crias_vivas:     Mapped[int]          = mapped_column(SmallInteger, nullable=False)
    peso_total_crias_kg: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    houve_distorcia:     Mapped[bool]         = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    houve_obito_matriz:  Mapped[bool]         = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    observacoes:         Mapped[str | None]   = mapped_column(Text, nullable=True)
    created_at:          Mapped[datetime]     = mapped_column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))

    __table_args__ = (
        CheckConstraint("num_crias >= 1", name="chk_parto_num_crias"),
        CheckConstraint("num_crias_vivas >= 0 AND num_crias_vivas <= num_crias", name="chk_parto_crias_vivas"),
        CheckConstraint("tipo_parto <> 'SIMPLES' OR num_crias = 1", name="chk_parto_tipo_simples"),
        CheckConstraint("tipo_parto <> 'DUPLO' OR num_crias = 2", name="chk_parto_tipo_duplo"),
        CheckConstraint("tipo_parto <> 'MULTIPLO' OR num_crias >= 3", name="chk_parto_tipo_multiplo"),
        CheckConstraint("peso_total_crias_kg IS NULL OR peso_total_crias_kg > 0", name="chk_parto_peso"),
    )
