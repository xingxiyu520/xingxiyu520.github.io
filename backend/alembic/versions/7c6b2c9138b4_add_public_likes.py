"""add public likes

Revision ID: 7c6b2c9138b4
Revises: 1a3c20962962
Create Date: 2026-07-09 22:20:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "7c6b2c9138b4"
down_revision: Union[str, None] = "1a3c20962962"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("articles", sa.Column("like_count", sa.Integer(), server_default="0", nullable=False))
    op.create_table(
        "likes",
        sa.Column("target_type", sa.String(length=20), nullable=False),
        sa.Column("target_id", sa.String(length=80), nullable=False),
        sa.Column("client_hash", sa.String(length=128), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("target_type IN ('site', 'article')", name="ck_likes_target_type"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("target_type", "target_id", "client_hash", name="uq_likes_target_client"),
    )
    op.create_index(op.f("ix_likes_client_hash"), "likes", ["client_hash"], unique=False)
    op.create_index("ix_likes_target", "likes", ["target_type", "target_id"], unique=False)
    op.create_index(op.f("ix_likes_target_type"), "likes", ["target_type"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_likes_target_type"), table_name="likes")
    op.drop_index("ix_likes_target", table_name="likes")
    op.drop_index(op.f("ix_likes_client_hash"), table_name="likes")
    op.drop_table("likes")
    op.drop_column("articles", "like_count")
