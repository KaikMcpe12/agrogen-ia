from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4
from sqlalchemy import SmallInteger, Integer, Numeric, DateTime, Text, text, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ENUM as PG_ENUM
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from models.base import Base
from models.enums import TipoInseminacao, ResultadoInseminacao


class InseminacaoModel(Base):
    __tablename__ = "inseminacoes"

    inseminacao_id:             Mapped[UUID]                  = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    animal_id:                  Mapped[UUID]                  = mapped_column(PG_UUID(as_uuid=True), ForeignKey("animais.animal_id", ondelete="RESTRICT"), nullable=False)
    reprodutor_id:              Mapped[UUID]                  = mapped_column(PG_UUID(as_uuid=True), ForeignKey("reprodutores.reprodutor_id", ondelete="RESTRICT"), nullable=False)
    tecnico_id:                 Mapped[UUID]                  = mapped_column(PG_UUID(as_uuid=True), ForeignKey("usuarios.usuario_id", ondelete="RESTRICT"), nullable=False)
    protocolo_id:               Mapped[UUID | None]           = mapped_column(PG_UUID(as_uuid=True), ForeignKey("protocolo_hormonal.protocolo_id", ondelete="RESTRICT"), nullable=True)
    data_inseminacao:           Mapped[datetime]              = mapped_column(DateTime, nullable=False)
    tipo:                       Mapped[TipoInseminacao]       = mapped_column(PG_ENUM(TipoInseminacao, name="tipo_inseminacao", create_type=False), nullable=False)
    condicao_corporal_momento:  Mapped[int]                   = mapped_column(SmallInteger, nullable=False)
    temperatura_ambiente_c:     Mapped[Decimal | None]        = mapped_column(Numeric(4, 1), nullable=True)
    dias_pos_parto:             Mapped[int | None]            = mapped_column(Integer, nullable=True)
    dias_desde_ultima_ins:      Mapped[int | None]            = mapped_column(Integer, nullable=True)
    ciclos_sem_concepcao:       Mapped[int]                   = mapped_column(SmallInteger, nullable=False, default=0, server_default="0")
    historico_prenhez:          Mapped[int]                   = mapped_column(SmallInteger, nullable=False, default=0, server_default="0")
    observacoes:                Mapped[str | None]            = mapped_column(Text, nullable=True)
    resultado:                  Mapped[ResultadoInseminacao]  = mapped_column(PG_ENUM(ResultadoInseminacao, name="resultado_inseminacao", create_type=False), nullable=False, server_default="PENDENTE")
    created_at:                 Mapped[datetime]              = mapped_column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    updated_at:                 Mapped[datetime]              = mapped_column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"), onupdate=func.now())

    __table_args__ = (
        CheckConstraint("condicao_corporal_momento BETWEEN 1 AND 5", name="chk_ins_condicao_corporal"),
        CheckConstraint("dias_pos_parto IS NULL OR dias_pos_parto >= 0", name="chk_ins_dias_pos_parto"),
        CheckConstraint("dias_desde_ultima_ins IS NULL OR dias_desde_ultima_ins >= 0", name="chk_ins_dias_ultima"),
        CheckConstraint("ciclos_sem_concepcao >= 0", name="chk_ins_ciclos"),
        CheckConstraint("historico_prenhez >= 0", name="chk_ins_historico"),
    )
