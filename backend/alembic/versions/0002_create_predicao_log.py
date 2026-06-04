"""create tb_predicao_log

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "tb_predicao_log",
        sa.Column("predicao_id",     postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("animal_id",       postgresql.UUID(as_uuid=True), sa.ForeignKey("animais.animal_id", ondelete="RESTRICT"), nullable=False),
        sa.Column("tecnico_id",      postgresql.UUID(as_uuid=True), sa.ForeignKey("usuarios.usuario_id", ondelete="SET NULL"), nullable=True),
        sa.Column("features_entrada", postgresql.JSONB, nullable=True),
        sa.Column("score_retornado", sa.Numeric(5, 4), nullable=False),
        sa.Column("classificacao",   sa.String(20), nullable=False),
        sa.Column("top_5_fatores",   postgresql.JSONB, nullable=True),
        sa.Column("modelo_versao",   sa.String(30), nullable=True),
        sa.Column("origem",          sa.String(10), nullable=False, server_default="rules"),
        sa.Column("created_at",      sa.DateTime, nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_index("idx_predicao_animal_id",  "tb_predicao_log", ["animal_id"])
    op.create_index("idx_predicao_created_at", "tb_predicao_log", ["created_at"])


def downgrade() -> None:
    op.drop_index("idx_predicao_created_at", table_name="tb_predicao_log")
    op.drop_index("idx_predicao_animal_id",  table_name="tb_predicao_log")
    op.drop_table("tb_predicao_log")
