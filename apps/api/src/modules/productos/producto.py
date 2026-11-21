from dataclasses import dataclass
from decimal import Decimal
from enum import Enum


class Categoria(Enum):
    BEBIDAS = "Bebidas"
    SALSAS = "Salsas"
    CONSERVAS = "Conservas"
    LACTEOS = "Lácteos"
    POSTRES = "Postres"
    ENVASES = "Envases"


@dataclass
class Producto:
    id: int
    nombre: str
    precio: Decimal
    precio_compra: Decimal
    categoria: Categoria
    stock: int
    foto: str
