from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from .producto import Categoria


class ProductoBase(BaseModel):
    nombre: str
    precio: Decimal
    precio_compra: Decimal
    categoria: Categoria
    stock: int
    foto: str


class ProductoWrite(ProductoBase):
    precio: Decimal = Field(max_digits=10, decimal_places=2)
    precio_compra: Decimal = Field(max_digits=10, decimal_places=2)
    stock: int = Field(ge=-2_147_483_648, le=2_147_483_647)


class ProductoCreate(ProductoWrite):
    pass


class ProductoUpdate(ProductoWrite):
    pass


class ProductoResponse(ProductoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
