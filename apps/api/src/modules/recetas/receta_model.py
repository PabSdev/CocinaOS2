from datetime import datetime
from decimal import Decimal
from typing import final
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from modules.ingredientes.ingrediente_model import IngredienteORM
from modules.platos.plato_model import PlatoORM
from shared.db import Base


@final
class RecetaORM(Base):
    __tablename__ = "recetas"
    __table_args__ = (
        UniqueConstraint(
            "plato_id", "ingrediente_id", name="uq_recetas_plato_ingrediente"
        ),
        CheckConstraint("cantidad > 0", name="ck_recetas_cantidad_positiva"),
        CheckConstraint(
            "merma_ingrediente_receta IS NULL OR (merma_ingrediente_receta >= 0 AND merma_ingrediente_receta < 100)",
            name="ck_recetas_merma_rango",
        ),
    )

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    plato_id: Mapped[UUID] = mapped_column(
        Uuid,
        ForeignKey("platos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    ingrediente_id: Mapped[UUID] = mapped_column(
        Uuid,
        ForeignKey("ingredientes.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    cantidad: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    unidad: Mapped[str] = mapped_column(String(8), nullable=False)
    merma_ingrediente_receta: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 2), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    plato: Mapped[PlatoORM] = relationship(lazy="raise")
    ingrediente: Mapped[IngredienteORM] = relationship(lazy="raise")
