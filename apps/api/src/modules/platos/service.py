from uuid import UUID

from shared.db import unit_of_work

from .plato import Plato, PlatoNotFoundError
from .repository import PlatoRepository
from .schema import PlatoCreate, PlatoUpdate


class PlatoService:
    """Coordina las operaciones y transacciones de platos."""

    async def get_platos(
        self, nombre: str | None = None, *, exacto: bool = False
    ) -> list[Plato]:
        async with unit_of_work() as session:
            return await PlatoRepository(session).get_platos(nombre, exacto=exacto)

    async def get_plato_by_id(self, plato_id: UUID) -> Plato:
        async with unit_of_work() as session:
            plato = await PlatoRepository(session).get_plato_by_id(plato_id)
        if plato is None:
            raise PlatoNotFoundError(plato_id)
        return plato

    async def create_plato(self, plato: PlatoCreate) -> Plato:
        async with unit_of_work() as session:
            return await PlatoRepository(session).create_plato(plato)

    async def update_plato(self, plato_id: UUID, plato: PlatoUpdate) -> Plato:
        changes: dict[str, object] = plato.model_dump(exclude_unset=True)
        async with unit_of_work() as session:
            actualizado = await PlatoRepository(session).update_plato(plato_id, changes)
        if actualizado is None:
            raise PlatoNotFoundError(plato_id)
        return actualizado

    async def delete_plato(self, plato_id: UUID) -> None:
        async with unit_of_work() as session:
            eliminado = await PlatoRepository(session).delete_plato(plato_id)
        if not eliminado:
            raise PlatoNotFoundError(plato_id)
