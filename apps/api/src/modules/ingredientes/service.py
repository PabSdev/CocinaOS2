from uuid import UUID

from shared.db import unit_of_work

from .ingrediente import Ingrediente, IngredienteNotFoundError, UnidadDeMasa
from .repository import IngredienteRepository
from .schema import IngredienteCreate, IngredienteUpdate


class IngredienteService:
    """Coordina las operaciones y transacciones de ingredientes."""

    async def get_ingredientes(
        self, nombre: str | None = None, *, exacto: bool = False
    ) -> list[Ingrediente]:
        async with unit_of_work() as session:
            return await IngredienteRepository(session).get_ingredientes(
                nombre, exacto=exacto
            )

    async def get_ingrediente_by_id(self, ingrediente_id: UUID) -> Ingrediente:
        async with unit_of_work() as session:
            ingrediente = await IngredienteRepository(session).get_ingrediente_by_id(
                ingrediente_id
            )
        if ingrediente is None:
            raise IngredienteNotFoundError(ingrediente_id)
        return ingrediente

    async def create_ingrediente(self, ingrediente: IngredienteCreate) -> Ingrediente:
        async with unit_of_work() as session:
            return await IngredienteRepository(session).create_ingrediente(ingrediente)

    async def update_ingrediente(
        self, ingrediente_id: UUID, ingrediente: IngredienteUpdate
    ) -> Ingrediente:
        changes: dict[str, object] = ingrediente.model_dump(exclude_unset=True)
        unidad = changes.get("unidad_de_masa")
        if isinstance(unidad, UnidadDeMasa):
            changes["unidad_de_masa"] = unidad.value

        async with unit_of_work() as session:
            actualizado = await IngredienteRepository(session).update_ingrediente(
                ingrediente_id, changes
            )
        if actualizado is None:
            raise IngredienteNotFoundError(ingrediente_id)
        return actualizado

    async def delete_ingrediente(self, ingrediente_id: UUID) -> None:
        async with unit_of_work() as session:
            eliminado = await IngredienteRepository(session).delete_ingrediente(
                ingrediente_id
            )
        if not eliminado:
            raise IngredienteNotFoundError(ingrediente_id)
