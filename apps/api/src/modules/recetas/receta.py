from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from modules.ingredientes.ingrediente import UnidadDeMasa
from modules.platos.plato import Plato

_MASS_UNITS: frozenset[UnidadDeMasa] = frozenset({UnidadDeMasa.G, UnidadDeMasa.KG})
_VOLUME_UNITS: frozenset[UnidadDeMasa] = frozenset({UnidadDeMasa.ML, UnidadDeMasa.L})


def are_units_compatible(recipe_unit: UnidadDeMasa, base_unit: UnidadDeMasa) -> bool:
    if recipe_unit in _MASS_UNITS and base_unit in _MASS_UNITS:
        return True
    if recipe_unit in _VOLUME_UNITS and base_unit in _VOLUME_UNITS:
        return True
    return recipe_unit == base_unit


@dataclass
class RecetaPlatoResumen:
    id: UUID
    nombre: str
    precio: Decimal
    foto: str | None
    stock: int


@dataclass
class RecetaIngredienteResumen:
    id: UUID
    nombre: str
    descripcion: str | None
    stock: Decimal
    unidad_de_masa: UnidadDeMasa
    precio_compra: Decimal | None
    merma_habitual: Decimal | None


@dataclass
class RecetaLinea:
    id: UUID
    plato_id: UUID
    ingrediente_id: UUID
    cantidad: Decimal
    unidad: UnidadDeMasa
    merma_ingrediente_receta: Decimal | None
    created_at: datetime
    updated_at: datetime
    plato: RecetaPlatoResumen | None = None
    ingrediente: RecetaIngredienteResumen | None = None


@dataclass
class RecetaEscandallo:
    plato: Plato
    lineas: list[RecetaLinea]
    version: str


class PlatoNoExisteError(Exception):
    """Se lanza cuando el plato asociado a la receta no existe."""


class IngredienteNoExisteError(Exception):
    """Se lanza cuando algún ingrediente asociado a la receta no existe."""


class IngredienteDuplicadoEnRecetaError(Exception):
    """Se lanza cuando se repite un ingrediente en la misma receta."""


class UnidadIncompatibleError(Exception):
    """Se lanza cuando la unidad de la receta no es compatible con la del ingrediente."""


class RecetaConflictError(Exception):
    """Se lanza ante un conflicto de concurrencia optimista al guardar un escandallo."""
