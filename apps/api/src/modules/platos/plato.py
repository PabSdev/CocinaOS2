from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from uuid import UUID


@dataclass
class Plato:
    id: UUID
    nombre: str
    precio: Decimal
    stock: int
    foto: str | None
    created_at: datetime
    updated_at: datetime


class PlatoNotFoundError(Exception):
    """Se lanza cuando no se encuentra el plato solicitado."""
