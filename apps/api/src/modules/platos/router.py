from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from .plato import Plato, PlatoNotFoundError
from .schema import PlatoCreate, PlatoResponse, PlatoUpdate
from .service import PlatoService

router = APIRouter(prefix="/platos", tags=["platos"])

PLATO_NO_ENCONTRADO = "Plato no encontrado"
RESPUESTA_404: dict[int | str, dict[str, object]] = {
    status.HTTP_404_NOT_FOUND: {
        "description": PLATO_NO_ENCONTRADO,
        "content": {"application/json": {"example": {"detail": PLATO_NO_ENCONTRADO}}},
    }
}


def get_plato_service() -> PlatoService:
    return PlatoService()


ServiceDep = Annotated[PlatoService, Depends(get_plato_service)]


@router.get("/", response_model=list[PlatoResponse])
async def get_platos(
    service: ServiceDep,
    nombre: str | None = None,
    exacto: bool = False,
) -> list[Plato]:
    """Lista los platos o filtra por nombre parcial o exacto."""
    return await service.get_platos(nombre, exacto=exacto)


@router.post(
    "/",
    response_model=PlatoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_plato(
    service: ServiceDep,
    plato: PlatoCreate,
) -> Plato:
    """Crea un nuevo plato."""
    return await service.create_plato(plato)


@router.get(
    "/{plato_id}",
    response_model=PlatoResponse,
    responses=RESPUESTA_404,
)
async def get_plato_by_id(
    service: ServiceDep,
    plato_id: UUID,
) -> Plato:
    """Obtiene un plato por su UUID."""
    try:
        return await service.get_plato_by_id(plato_id)
    except PlatoNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, PLATO_NO_ENCONTRADO) from exc


@router.patch(
    "/{plato_id}",
    response_model=PlatoResponse,
    responses=RESPUESTA_404,
)
async def update_plato(
    service: ServiceDep,
    plato_id: UUID,
    plato: PlatoUpdate,
) -> Plato:
    """Actualiza parcialmente un plato."""
    try:
        return await service.update_plato(plato_id, plato)
    except PlatoNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, PLATO_NO_ENCONTRADO) from exc


@router.delete(
    "/{plato_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=RESPUESTA_404,
)
async def delete_plato(
    service: ServiceDep,
    plato_id: UUID,
) -> None:
    """Elimina un plato por su UUID."""
    try:
        await service.delete_plato(plato_id)
    except PlatoNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, PLATO_NO_ENCONTRADO) from exc
