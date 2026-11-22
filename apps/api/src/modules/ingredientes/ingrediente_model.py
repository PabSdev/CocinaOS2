from datetime import datetime
from decimal import Decimal
from typing import final
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Numeric, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from shared.db import Base


@final
class IngredienteORM(Base):
    __tablename__ = "ingredientes"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    nombre: Mapped[str] = mapped_column(nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    stock: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    unidad_de_masa: Mapped[str] = mapped_column(String(8), nullable=False)
    precio_compra: Mapped[Decimal | None] = mapped_column(Numeric(12, 4), nullable=True)
    merma_habitual: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
