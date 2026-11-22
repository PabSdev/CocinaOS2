import json
from uuid import UUID

from sqlalchemy.exc import IntegrityError

from modules.ingredientes.ingrediente import UnidadDeMasa
from modules.ingredientes.repository import IngredienteRepository
from modules.platos.plato import Plato
from modules.platos.repository import PlatoRepository
from shared.db import unit_of_work

from .receta import (
    IngredienteDuplicadoEnRecetaError,
    IngredienteNoExisteError,
    PlatoNoExisteError,
    RecetaConflictError,
    RecetaEscandallo,
    RecetaLinea,
    RecetaNotFoundError,
    UnidadIncompatibleError,
    are_units_compatible,
)
from .repository import RecetaRepository
from .schema import RecetaCreate, RecetaPlatoSyncRequest, RecetaUpdate


def build_escandallo_version(plato: Plato, lineas: list[RecetaLinea]) -> str:
    sorted_lines = sorted(lineas, key=lambda item: str(item.id))
    return json.dumps(
        [
            plato.updated_at.isoformat(),
            [[str(line.id), line.updated_at.isoformat()] for line in sorted_lines],
        ]
    )


class RecetaService:
    """Coordina las operaciones y transacciones de recetas y escandallos."""

    async def get_recetas(
        self,
        plato_id: UUID | None = None,
        ingrediente_id: UUID | None = None,
    ) -> list[RecetaLinea]:
        async with unit_of_work() as session:
            return await RecetaRepository(session).get_recetas(
                plato_id=plato_id, ingrediente_id=ingrediente_id
            )

    async def get_receta_by_id(self, receta_id: UUID) -> RecetaLinea:
        async with unit_of_work() as session:
            receta = await RecetaRepository(session).get_receta_by_id(receta_id)
        if receta is None:
            raise RecetaNotFoundError(receta_id)
        return receta

    async def create_receta(self, payload: RecetaCreate) -> RecetaLinea:
        async with unit_of_work() as session:
            plato = await PlatoRepository(session).get_plato_by_id(payload.plato_id)
            if plato is None:
                raise PlatoNoExisteError(payload.plato_id)

            ingrediente = await IngredienteRepository(session).get_ingrediente_by_id(
                payload.ingrediente_id
            )
            if ingrediente is None:
                raise IngredienteNoExisteError(payload.ingrediente_id)

            if not are_units_compatible(payload.unidad, ingrediente.unidad_de_masa):
                raise UnidadIncompatibleError(
                    "La unidad de la receta debe ser compatible con la unidad de compra."
                )

            repo = RecetaRepository(session)
            existing = await repo.get_by_plato_and_ingrediente(
                payload.plato_id, payload.ingrediente_id
            )
            if existing is not None:
                updated = await repo.update_receta(
                    existing.id,
                    {
                        "cantidad": payload.cantidad,
                        "unidad": payload.unidad.value,
                        "merma_ingrediente_receta": payload.merma_ingrediente_receta,
                    },
                )
                if updated is None:
                    raise RecetaNotFoundError(existing.id)
                return updated

            try:
                return await repo.create_receta(
                    plato_id=payload.plato_id,
                    ingrediente_id=payload.ingrediente_id,
                    cantidad=payload.cantidad,
                    unidad=payload.unidad,
                    merma_ingrediente_receta=payload.merma_ingrediente_receta,
                )
            except IntegrityError as exc:
                if getattr(exc.orig, "sqlstate", None) == "23505":
                    raise IngredienteDuplicadoEnRecetaError(
                        payload.ingrediente_id
                    ) from exc
                raise

    async def update_receta(
        self, receta_id: UUID, payload: RecetaUpdate
    ) -> RecetaLinea:
        changes: dict[str, object] = payload.model_dump(exclude_unset=True)
        async with unit_of_work() as session:
            repo = RecetaRepository(session)
            current = await repo.get_receta_by_id(receta_id)
            if current is None:
                raise RecetaNotFoundError(receta_id)

            target_ingrediente_id = (
                payload.ingrediente_id
                if payload.ingrediente_id is not None
                else current.ingrediente_id
            )
            target_unidad = (
                payload.unidad if payload.unidad is not None else current.unidad
            )

            ingrediente = await IngredienteRepository(session).get_ingrediente_by_id(
                target_ingrediente_id
            )
            if ingrediente is None:
                raise IngredienteNoExisteError(target_ingrediente_id)

            if not are_units_compatible(target_unidad, ingrediente.unidad_de_masa):
                raise UnidadIncompatibleError(
                    "La unidad de la receta debe ser compatible con la unidad de compra."
                )

            if target_ingrediente_id != current.ingrediente_id:
                duplicate = await repo.get_by_plato_and_ingrediente(
                    current.plato_id, target_ingrediente_id
                )
                if duplicate is not None and duplicate.id != receta_id:
                    raise IngredienteDuplicadoEnRecetaError(target_ingrediente_id)

            unidad = changes.get("unidad")
            if isinstance(unidad, UnidadDeMasa):
                changes["unidad"] = unidad.value

            try:
                updated = await repo.update_receta(receta_id, changes)
            except IntegrityError as exc:
                if getattr(exc.orig, "sqlstate", None) == "23505":
                    raise IngredienteDuplicadoEnRecetaError(
                        target_ingrediente_id
                    ) from exc
                raise
            if updated is None:
                raise RecetaNotFoundError(receta_id)
            return updated

    async def delete_receta(self, receta_id: UUID) -> None:
        async with unit_of_work() as session:
            eliminado = await RecetaRepository(session).delete_receta(receta_id)
        if not eliminado:
            raise RecetaNotFoundError(receta_id)

    async def get_escandallo(self, plato_id: UUID) -> RecetaEscandallo:
        async with unit_of_work() as session:
            plato = await PlatoRepository(session).get_plato_by_id(plato_id)
            if plato is None:
                raise PlatoNoExisteError(plato_id)
            lineas = await RecetaRepository(session).get_recetas(plato_id=plato_id)
        return RecetaEscandallo(
            plato=plato,
            lineas=lineas,
            version=build_escandallo_version(plato, lineas),
        )

    async def sync_plato_receta(
        self, plato_id: UUID, payload: RecetaPlatoSyncRequest
    ) -> RecetaEscandallo:
        async with unit_of_work() as session:
            plato_repo = PlatoRepository(session)
            receta_repo = RecetaRepository(session)
            ingrediente_repo = IngredienteRepository(session)

            plato = await plato_repo.get_plato_by_id(plato_id, for_update=True)
            if plato is None:
                raise PlatoNoExisteError(plato_id)

            current_lines = await receta_repo.get_recetas(plato_id=plato_id)
            if payload.expected_version is not None:
                current_version = build_escandallo_version(plato, current_lines)
                if current_version != payload.expected_version:
                    raise RecetaConflictError(
                        "El plato o la receta han cambiado. Recarga la página antes de volver a guardar."
                    )

            current_ids = {line.id for line in current_lines}
            seen_line_ids: set[UUID] = set()
            seen_ingrediente_ids: set[UUID] = set()

            requested_ingrediente_ids = {line.ingrediente_id for line in payload.lineas}
            ingredientes = await ingrediente_repo.get_ingredientes_by_ids(
                requested_ingrediente_ids
            )
            ingredientes_by_id = {item.id: item for item in ingredientes}

            for line in payload.lineas:
                if line.ingrediente_id in seen_ingrediente_ids:
                    raise IngredienteDuplicadoEnRecetaError(
                        "Selecciona un ingrediente distinto en cada línea."
                    )
                seen_ingrediente_ids.add(line.ingrediente_id)

                if line.id is not None:
                    if line.id not in current_ids or line.id in seen_line_ids:
                        raise RecetaConflictError(
                            "El plato o la receta han cambiado. Recarga la página antes de volver a guardar."
                        )
                    seen_line_ids.add(line.id)

                ingrediente = ingredientes_by_id.get(line.ingrediente_id)
                if ingrediente is None:
                    raise IngredienteNoExisteError(line.ingrediente_id)

                if not are_units_compatible(line.unidad, ingrediente.unidad_de_masa):
                    raise UnidadIncompatibleError(
                        "La unidad de la receta debe ser compatible con la unidad de compra."
                    )

            updated_plato = plato
            if "precio" in payload.model_fields_set and payload.precio is not None:
                plato_after = await plato_repo.update_plato(
                    plato_id, {"precio": payload.precio}
                )
                if plato_after is None:
                    raise PlatoNoExisteError(plato_id)
                updated_plato = plato_after

            updated_lines = await receta_repo.sync_plato_receta(
                plato_id, current_lines, payload.lineas
            )
            return RecetaEscandallo(
                plato=updated_plato,
                lineas=updated_lines,
                version=build_escandallo_version(updated_plato, updated_lines),
            )
