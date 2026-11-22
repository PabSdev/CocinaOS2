from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from uuid import UUID


class UnidadDeMasa(StrEnum):
    G = "G"
    KG = "KG"
    ML = "ML"
    L = "L"


@dataclass
class Ingrediente:
    id: UUID
    nombre: str
    descripcion: str | None
    stock: Decimal
    unidad_de_masa: UnidadDeMasa
    precio_compra: Decimal | None
    merma_habitual: Decimal | None
    created_at: datetime
    updated_at: datetime


class IngredienteNotFoundError(Exception):
    """Se lanza cuando no se encuentra el ingrediente solicitado."""
