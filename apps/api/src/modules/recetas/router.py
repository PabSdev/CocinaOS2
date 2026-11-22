from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from .receta import (
    IngredienteDuplicadoEnRecetaError,
    IngredienteNoExisteError,
    PlatoNoExisteError,
    RecetaConflictError,
    RecetaEscandallo,
    RecetaLinea,
    UnidadIncompatibleError,
)
from .schema import (
    RecetaEscandalloResponse,
    RecetaPlatoSyncRequest,
    RecetaResponse,
)
from .service import RecetaService

router = APIRouter(prefix="/recetas", tags=["recetas"])

PLATO_NO_ENCONTRADO = "Plato no encontrado"
INGREDIENTE_NO_ENCONTRADO = "Ingrediente no encontrado"
CONFLICTO_ESCANDALLO = (
    "El plato o la receta han cambiado. Recarga la página antes de volver a guardar."
)
INGREDIENTE_DUPLICADO = "Selecciona un ingrediente distinto en cada línea."
UNIDAD_INCOMPATIBLE = (
    "La unidad de la receta debe ser compatible con la unidad de compra."
)

RESPUESTA_404: dict[int | str, dict[str, object]] = {
    status.HTTP_404_NOT_FOUND: {"description": PLATO_NO_ENCONTRADO}
}
RESPUESTA_SYNC: dict[int | str, dict[str, object]] = {
    status.HTTP_404_NOT_FOUND: {"description": "Plato o ingrediente no encontrado"},
    status.HTTP_409_CONFLICT: {"description": "Conflicto de concurrencia o duplicidad"},
    status.HTTP_422_UNPROCESSABLE_CONTENT: {
        "description": "Error de validación de negocio"
    },
}


def get_receta_service() -> RecetaService:
    return RecetaService()


ServiceDep = Annotated[RecetaService, Depends(get_receta_service)]


@router.get("/", response_model=list[RecetaResponse])
async def get_recetas(
    service: ServiceDep,
    plato_id: UUID | None = None,
    ingrediente_id: UUID | None = None,
) -> list[RecetaLinea]:
    """Lista las líneas de receta o filtra por plato o ingrediente."""
    return await service.get_recetas(plato_id=plato_id, ingrediente_id=ingrediente_id)


@router.get(
    "/plato/{plato_id}/escandallo",
    response_model=RecetaEscandalloResponse,
    responses=RESPUESTA_404,
)
async def get_escandallo(
    service: ServiceDep,
    plato_id: UUID,
) -> RecetaEscandallo:
    """Obtiene la ficha de escandallo completa de un plato junto a su versión."""
    try:
        return await service.get_escandallo(plato_id)
    except PlatoNoExisteError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, PLATO_NO_ENCONTRADO) from exc


@router.put(
    "/plato/{plato_id}",
    response_model=RecetaEscandalloResponse,
    responses=RESPUESTA_SYNC,
)
async def sync_plato_receta(
    service: ServiceDep,
    plato_id: UUID,
    payload: RecetaPlatoSyncRequest,
) -> RecetaEscandallo:
    """Sincroniza atómicamente las líneas de receta y el PVP opcional de un plato."""
    try:
        return await service.sync_plato_receta(plato_id, payload)
    except PlatoNoExisteError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, PLATO_NO_ENCONTRADO) from exc
    except IngredienteNoExisteError as exc:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, INGREDIENTE_NO_ENCONTRADO
        ) from exc
    except IngredienteDuplicadoEnRecetaError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, INGREDIENTE_DUPLICADO) from exc
    except RecetaConflictError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, CONFLICTO_ESCANDALLO) from exc
    except UnidadIncompatibleError as exc:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, UNIDAD_INCOMPATIBLE
        ) from exc
