from decimal import Decimal

from sqlalchemy import Numeric
from sqlalchemy.orm import Mapped, mapped_column

from shared.db import Base


class ProductoORM(Base):
    __tablename__ = "productos"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column()
    precio: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
    )
    precio_compra: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
    )
    stock: Mapped[int] = mapped_column()
    categoria: Mapped[str] = mapped_column()
    foto: Mapped[str] = mapped_column()
