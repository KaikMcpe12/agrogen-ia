"""create tb_refresh_tokens

Revision ID: 0001
Revises:
Create Date: 2026-06-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "tb_refresh_tokens",
        sa.Column("token_id",   sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("usuario_id", sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey("usuarios.usuario_id", ondelete="CASCADE"), nullable=False),
        sa.Column("token",      sa.Text, nullable=False, unique=True),
        sa.Column("revogado",   sa.Boolean, nullable=False, server_default="false"),
        sa.Column("expires_at", sa.DateTime, nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_index("idx_refresh_tokens_usuario_id", "tb_refresh_tokens", ["usuario_id"])
    op.create_index("idx_refresh_tokens_token",      "tb_refresh_tokens", ["token"], unique=True)


def downgrade() -> None:
    op.drop_index("idx_refresh_tokens_token",      table_name="tb_refresh_tokens")
    op.drop_index("idx_refresh_tokens_usuario_id", table_name="tb_refresh_tokens")
    op.drop_table("tb_refresh_tokens")
