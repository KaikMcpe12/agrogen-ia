from datetime import date, datetime
from uuid import UUID, uuid4
from sqlalchemy import Integer, DateTime, Date, Text, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ENUM as PG_ENUM
from sqlalchemy.orm import Mapped, mapped_column, DeclarativeBase
from sqlalchemy.sql import func

from models.enums import MetodoDiagnostico, ResultadoDiagnostico
from models.base import Base


class DiagnosticoModel(Base):
    __tablename__ = "diagnosticos"

    diagnostico_id:     Mapped[UUID]      = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    inseminacao_id:     Mapped[UUID]      = mapped_column(PG_UUID(as_uuid=True), nullable=False, unique=True)
    animal_id:          Mapped[UUID]      = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    data_diagnostico:   Mapped[date]      = mapped_column(Date, nullable=False)
    metodo:             Mapped[MetodoDiagnostico]    = mapped_column(PG_ENUM(MetodoDiagnostico, name="metodo_diagnostico", create_type=False), nullable=False)
    resultado:          Mapped[ResultadoDiagnostico] = mapped_column(PG_ENUM(ResultadoDiagnostico, name="resultado_diagnostico", create_type=False), nullable=False)
    dias_gestacao_est:  Mapped[int | None]  = mapped_column(Integer, nullable=True)
    data_parto_prevista: Mapped[date | None] = mapped_column(Date, nullable=True)
    veterinario_id:     Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), nullable=True)
    observacoes:        Mapped[str | None]  = mapped_column(Text, nullable=True)
    created_at:         Mapped[datetime]    = mapped_column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))