from datetime import datetime
from decimal import Decimal
from typing import ClassVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from modules.ingredientes.ingrediente import UnidadDeMasa
from modules.platos.schema import PlatoResponse


class RecetaPlatoResumenResponse(BaseModel):
    model_config: ClassVar[ConfigDict] = ConfigDict(from_attributes=True)

    id: UUID
    nombre: str
    precio: Decimal
    foto: str | None = None
    stock: int


class RecetaIngredienteResumenResponse(BaseModel):
    model_config: ClassVar[ConfigDict] = ConfigDict(from_attributes=True)

    id: UUID
    nombre: str
    descripcion: str | None = None
    stock: Decimal
    unidad_de_masa: UnidadDeMasa
    precio_compra: Decimal | None = None
    merma_habitual: Decimal | None = None


class RecetaLineaSync(BaseModel):
    id: UUID | None = None
    ingrediente_id: UUID
    cantidad: Decimal = Field(gt=0, max_digits=12, decimal_places=4)
    unidad: UnidadDeMasa
    merma_ingrediente_receta: Decimal | None = Field(
        default=None, ge=0, lt=100, max_digits=5, decimal_places=2
    )


class RecetaPlatoSyncRequest(BaseModel):
    lineas: list[RecetaLineaSync]
    precio: Decimal | None = Field(
        default=None, ge=0, max_digits=10, decimal_places=2
    )
    expected_version: str | None = None


class RecetaResponse(BaseModel):
    model_config: ClassVar[ConfigDict] = ConfigDict(from_attributes=True)

    id: UUID
    plato_id: UUID
    ingrediente_id: UUID
    cantidad: Decimal
    unidad: UnidadDeMasa
    merma_ingrediente_receta: Decimal | None = None
    created_at: datetime
    updated_at: datetime
    plato: RecetaPlatoResumenResponse | None = None
    ingrediente: RecetaIngredienteResumenResponse | None = None


class RecetaEscandalloResponse(BaseModel):
    model_config: ClassVar[ConfigDict] = ConfigDict(from_attributes=True)

    plato: PlatoResponse
    lineas: list[RecetaResponse]
    version: str
