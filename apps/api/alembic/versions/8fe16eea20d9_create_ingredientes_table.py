"""create_ingredientes_table

Revision ID: 8fe16eea20d9
Revises: 7beb4de567db
Create Date: 2026-11-22 17:52:23.986247

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "8fe16eea20d9"
down_revision: str | Sequence[str] | None = "7beb4de567db"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    _ = op.create_table(
        "ingredientes",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("nombre", sa.String(), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("stock", sa.Numeric(precision=12, scale=4), nullable=False),
        sa.Column("unidad_de_masa", sa.String(length=8), nullable=False),
        sa.Column("precio_compra", sa.Numeric(precision=12, scale=4), nullable=True),
        sa.Column("merma_habitual", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("ingredientes")
