from datetime import datetime
from decimal import Decimal
from typing import final
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, Integer, Numeric, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from shared.db import Base


@final
class PlatoORM(Base):
    __tablename__ = "platos"
    __table_args__ = (
        CheckConstraint("precio >= 0", name="ck_platos_precio_no_negativo"),
        CheckConstraint("stock >= 0", name="ck_platos_stock_no_negativo"),
    )

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    nombre: Mapped[str] = mapped_column(nullable=False)
    precio: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False, default=Decimal(0)
    )
    stock: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    foto: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
