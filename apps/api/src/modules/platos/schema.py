from datetime import datetime
from decimal import Decimal
from typing import ClassVar, Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


def _normalize_nombre(value: str) -> str:
    stripped = value.strip()
    if not stripped:
        raise ValueError("El nombre del plato no puede estar vacío.")
    return stripped


def _normalize_foto(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


class PlatoBase(BaseModel):
    nombre: str
    precio: Decimal = Decimal(0)
    stock: int = 0
    foto: str | None = None


class PlatoCreate(PlatoBase):
    nombre: str = Field(min_length=1)
    precio: Decimal = Field(default=Decimal(0), ge=0, max_digits=10, decimal_places=2)
    stock: int = Field(default=0, ge=0)
    foto: str | None = Field(default=None, max_length=512)

    @field_validator("nombre")
    @classmethod
    def validate_nombre(cls, value: str) -> str:
        return _normalize_nombre(value)

    @field_validator("foto")
    @classmethod
    def validate_foto(cls, value: str | None) -> str | None:
        return _normalize_foto(value)


class PlatoUpdate(BaseModel):
    nombre: str | None = None
    precio: Decimal | None = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    stock: int | None = Field(default=None, ge=0)
    foto: str | None = Field(default=None, max_length=512)

    @field_validator("nombre")
    @classmethod
    def validate_nombre(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _normalize_nombre(value)

    @field_validator("foto")
    @classmethod
    def validate_foto(cls, value: str | None) -> str | None:
        return _normalize_foto(value)

    @model_validator(mode="after")
    def validate_required_fields_not_null(self) -> Self:
        for field in ("nombre", "precio", "stock"):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"El campo '{field}' no puede ser nulo.")
        return self


class PlatoResponse(PlatoBase):
    model_config: ClassVar[ConfigDict] = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
