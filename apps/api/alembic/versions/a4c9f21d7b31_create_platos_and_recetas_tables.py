"""create_platos_and_recetas_tables

Revision ID: a4c9f21d7b31
Revises: 8fe16eea20d9
Create Date: 2026-11-22 23:15:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a4c9f21d7b31"
down_revision: str | Sequence[str] | None = "8fe16eea20d9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    _ = op.create_table(
        "platos",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("nombre", sa.String(), nullable=False),
        sa.Column(
            "precio",
            sa.Numeric(precision=10, scale=2),
            server_default=sa.text("0"),
            nullable=False,
        ),
        sa.Column(
            "stock",
            sa.Integer(),
            server_default=sa.text("0"),
            nullable=False,
        ),
        sa.Column("foto", sa.String(length=512), nullable=True),
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
        sa.CheckConstraint("precio >= 0", name="ck_platos_precio_no_negativo"),
        sa.CheckConstraint("stock >= 0", name="ck_platos_stock_no_negativo"),
        sa.PrimaryKeyConstraint("id"),
    )

    _ = op.create_table(
        "recetas",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("plato_id", sa.Uuid(), nullable=False),
        sa.Column("ingrediente_id", sa.Uuid(), nullable=False),
        sa.Column("cantidad", sa.Numeric(precision=12, scale=4), nullable=False),
        sa.Column("unidad", sa.String(length=8), nullable=False),
        sa.Column(
            "merma_ingrediente_receta",
            sa.Numeric(precision=5, scale=2),
            nullable=True,
        ),
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
        sa.CheckConstraint("cantidad > 0", name="ck_recetas_cantidad_positiva"),
        sa.CheckConstraint(
            "merma_ingrediente_receta IS NULL OR (merma_ingrediente_receta >= 0 AND merma_ingrediente_receta < 100)",
            name="ck_recetas_merma_rango",
        ),
        sa.ForeignKeyConstraint(["plato_id"], ["platos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["ingrediente_id"], ["ingredientes.id"], ondelete="RESTRICT"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "plato_id", "ingrediente_id", name="uq_recetas_plato_ingrediente"
        ),
    )
    op.create_index("ix_recetas_plato_id", "recetas", ["plato_id"], unique=False)
    op.create_index(
        "ix_recetas_ingrediente_id", "recetas", ["ingrediente_id"], unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_recetas_ingrediente_id", table_name="recetas")
    op.drop_index("ix_recetas_plato_id", table_name="recetas")
    op.drop_table("recetas")
    op.drop_table("platos")
