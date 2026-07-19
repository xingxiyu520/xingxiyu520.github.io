"""add v11 content and analytics

Revision ID: b8e4f3a21c07
Revises: 7c6b2c9138b4
Create Date: 2026-07-19 23:35:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b8e4f3a21c07"
down_revision: Union[str, None] = "7c6b2c9138b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("projects", sa.Column("content_markdown", sa.Text(), server_default="", nullable=False))
    op.create_table(
        "analytics_events",
        sa.Column("event_type", sa.String(length=40), nullable=False),
        sa.Column("target_type", sa.String(length=40), nullable=True),
        sa.Column("target_id", sa.String(length=80), nullable=True),
        sa.Column("target_url", sa.String(length=500), nullable=True),
        sa.Column("path", sa.String(length=500), nullable=False),
        sa.Column("referrer", sa.String(length=500), nullable=True),
        sa.Column("client_hash", sa.String(length=128), nullable=False),
        sa.Column("ip_hash", sa.String(length=128), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_analytics_events_client_hash"), "analytics_events", ["client_hash"], unique=False)
    op.create_index(op.f("ix_analytics_events_event_type"), "analytics_events", ["event_type"], unique=False)
    op.create_index(op.f("ix_analytics_events_ip_hash"), "analytics_events", ["ip_hash"], unique=False)
    op.create_index(op.f("ix_analytics_events_occurred_at"), "analytics_events", ["occurred_at"], unique=False)
    op.create_index(op.f("ix_analytics_events_target_id"), "analytics_events", ["target_id"], unique=False)
    op.create_index(op.f("ix_analytics_events_target_type"), "analytics_events", ["target_type"], unique=False)
    op.create_index("ix_analytics_events_target", "analytics_events", ["target_type", "target_id"], unique=False)
    op.create_index("ix_analytics_events_type_time", "analytics_events", ["event_type", "occurred_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_analytics_events_type_time", table_name="analytics_events")
    op.drop_index("ix_analytics_events_target", table_name="analytics_events")
    op.drop_index(op.f("ix_analytics_events_target_type"), table_name="analytics_events")
    op.drop_index(op.f("ix_analytics_events_target_id"), table_name="analytics_events")
    op.drop_index(op.f("ix_analytics_events_occurred_at"), table_name="analytics_events")
    op.drop_index(op.f("ix_analytics_events_ip_hash"), table_name="analytics_events")
    op.drop_index(op.f("ix_analytics_events_event_type"), table_name="analytics_events")
    op.drop_index(op.f("ix_analytics_events_client_hash"), table_name="analytics_events")
    op.drop_table("analytics_events")
    op.drop_column("projects", "content_markdown")
