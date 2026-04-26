"""add sale rent type

Revision ID: 20260426_0002
Revises: 20260425_0001
Create Date: 2026-04-26
"""
from collections.abc import Sequence

from alembic import op

revision: str = "20260426_0002"
down_revision: str | Sequence[str] | None = "20260425_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("ALTER TYPE rent_type ADD VALUE IF NOT EXISTS 'sale'")


def downgrade() -> None:
    # PostgreSQL cannot safely remove enum values without recreating the type;
    # keep downgrade as a no-op to avoid destructive data loss.
    pass
