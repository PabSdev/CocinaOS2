from datetime import datetime
from decimal import Decimal
from typing import ClassVar, Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

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


class RecetaBase(BaseModel):
    plato_id: UUID
    ingrediente_id: UUID
    cantidad: Decimal
    unidad: UnidadDeMasa
    merma_ingrediente_receta: Decimal | None = None


class RecetaCreate(RecetaBase):
    cantidad: Decimal = Field(gt=0, max_digits=12, decimal_places=4)
    merma_ingrediente_receta: Decimal | None = Field(
        default=None, ge=0, lt=100, max_digits=5, decimal_places=2
    )


class RecetaUpdate(BaseModel):
    ingrediente_id: UUID | None = None
    cantidad: Decimal | None = Field(
        default=None, gt=0, max_digits=12, decimal_places=4
    )
    unidad: UnidadDeMasa | None = None
    merma_ingrediente_receta: Decimal | None = Field(
        default=None, ge=0, lt=100, max_digits=5, decimal_places=2
    )

    @model_validator(mode="after")
    def validate_required_fields_not_null(self) -> Self:
        for field in ("ingrediente_id", "cantidad", "unidad"):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"El campo '{field}' no puede ser nulo.")
        return self


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
    precio: Decimal | None = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    expected_version: str | None = None


class RecetaResponse(RecetaBase):
    model_config: ClassVar[ConfigDict] = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
    plato: RecetaPlatoResumenResponse | None = None
    ingrediente: RecetaIngredienteResumenResponse | None = None


class RecetaEscandalloResponse(BaseModel):
    model_config: ClassVar[ConfigDict] = ConfigDict(from_attributes=True)

    plato: PlatoResponse
    lineas: list[RecetaResponse]
    version: str
