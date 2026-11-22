import json
from uuid import UUID

from sqlalchemy.exc import IntegrityError

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
    UnidadIncompatibleError,
    are_units_compatible,
)
from .repository import RecetaRepository
from .schema import RecetaPlatoSyncRequest


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
            if (
                payload.expected_version is not None
                and build_escandallo_version(plato, current_lines)
                != payload.expected_version
            ):
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

            try:
                updated_lines = await receta_repo.sync_plato_receta(
                    plato_id, current_lines, payload.lineas
                )
            except IntegrityError as exc:
                if getattr(exc.orig, "sqlstate", None) == "23505":
                    raise RecetaConflictError(
                        "El plato o la receta han cambiado. Recarga la página antes de volver a guardar."
                    ) from exc
                raise

            return RecetaEscandallo(
                plato=updated_plato,
                lineas=updated_lines,
                version=build_escandallo_version(updated_plato, updated_lines),
            )
