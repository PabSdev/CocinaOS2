from datetime import datetime
from decimal import Decimal
from typing import ClassVar, Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from .ingrediente import UnidadDeMasa


def _normalize_nombre(value: str) -> str:
    stripped = value.strip()
    if not stripped:
        raise ValueError("El nombre del ingrediente no puede estar vacío.")
    return stripped


def _normalize_descripcion(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


class IngredienteBase(BaseModel):
    nombre: str
    descripcion: str | None = None
    stock: Decimal
    unidad_de_masa: UnidadDeMasa
    precio_compra: Decimal | None = None
    merma_habitual: Decimal | None = None


class IngredienteCreate(IngredienteBase):
    nombre: str = Field(min_length=1)
    stock: Decimal = Field(ge=0, max_digits=12, decimal_places=4)
    precio_compra: Decimal | None = Field(
        default=None, ge=0, max_digits=12, decimal_places=4
    )
    merma_habitual: Decimal | None = Field(
        default=None, ge=0, lt=100, max_digits=5, decimal_places=2
    )

    @field_validator("nombre")
    @classmethod
    def validate_nombre(cls, value: str) -> str:
        return _normalize_nombre(value)

    @field_validator("descripcion")
    @classmethod
    def validate_descripcion(cls, value: str | None) -> str | None:
        return _normalize_descripcion(value)


class IngredienteUpdate(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None
    stock: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=4)
    unidad_de_masa: UnidadDeMasa | None = None
    precio_compra: Decimal | None = Field(
        default=None, ge=0, max_digits=12, decimal_places=4
    )
    merma_habitual: Decimal | None = Field(
        default=None, ge=0, lt=100, max_digits=5, decimal_places=2
    )

    @field_validator("nombre")
    @classmethod
    def validate_nombre(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _normalize_nombre(value)

    @field_validator("descripcion")
    @classmethod
    def validate_descripcion(cls, value: str | None) -> str | None:
        return _normalize_descripcion(value)

    @model_validator(mode="after")
    def validate_required_fields_not_null(self) -> Self:
        for field in ("nombre", "stock", "unidad_de_masa"):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"El campo '{field}' no puede ser nulo.")
        return self


class IngredienteResponse(IngredienteBase):
    model_config: ClassVar[ConfigDict] = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
