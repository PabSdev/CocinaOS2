from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from .ingrediente import Ingrediente, IngredienteEnUsoError, IngredienteNotFoundError
from .schema import IngredienteCreate, IngredienteResponse, IngredienteUpdate
from .service import IngredienteService

router = APIRouter(prefix="/ingredientes", tags=["ingredientes"])

INGREDIENTE_NO_ENCONTRADO = "Ingrediente no encontrado"
INGREDIENTE_EN_USO = (
    "No se puede eliminar el ingrediente porque está asociado a una o más recetas."
)
RESPUESTA_404: dict[int | str, dict[str, object]] = {
    status.HTTP_404_NOT_FOUND: {
        "description": INGREDIENTE_NO_ENCONTRADO,
        "content": {
            "application/json": {"example": {"detail": INGREDIENTE_NO_ENCONTRADO}}
        },
    }
}
RESPUESTA_DELETE: dict[int | str, dict[str, object]] = {
    **RESPUESTA_404,
    status.HTTP_409_CONFLICT: {"description": INGREDIENTE_EN_USO},
}


def get_ingrediente_service() -> IngredienteService:
    return IngredienteService()


ServiceDep = Annotated[IngredienteService, Depends(get_ingrediente_service)]


@router.get("/", response_model=list[IngredienteResponse])
async def get_ingredientes(
    service: ServiceDep,
    nombre: str | None = None,
    exacto: bool = False,
) -> list[Ingrediente]:
    """Lista los ingredientes o filtra por nombre parcial o exacto."""
    return await service.get_ingredientes(nombre, exacto=exacto)


@router.post(
    "/",
    response_model=IngredienteResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_ingrediente(
    service: ServiceDep,
    ingrediente: IngredienteCreate,
) -> Ingrediente:
    """Crea un nuevo ingrediente."""
    return await service.create_ingrediente(ingrediente)


@router.get(
    "/{ingrediente_id}",
    response_model=IngredienteResponse,
    responses=RESPUESTA_404,
)
async def get_ingrediente_by_id(
    service: ServiceDep,
    ingrediente_id: UUID,
) -> Ingrediente:
    """Obtiene un ingrediente por su UUID."""
    try:
        return await service.get_ingrediente_by_id(ingrediente_id)
    except IngredienteNotFoundError as exc:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, INGREDIENTE_NO_ENCONTRADO
        ) from exc


@router.patch(
    "/{ingrediente_id}",
    response_model=IngredienteResponse,
    responses=RESPUESTA_404,
)
async def update_ingrediente(
    service: ServiceDep,
    ingrediente_id: UUID,
    ingrediente: IngredienteUpdate,
) -> Ingrediente:
    """Actualiza parcialmente un ingrediente."""
    try:
        return await service.update_ingrediente(ingrediente_id, ingrediente)
    except IngredienteNotFoundError as exc:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, INGREDIENTE_NO_ENCONTRADO
        ) from exc


@router.delete(
    "/{ingrediente_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=RESPUESTA_DELETE,
)
async def delete_ingrediente(
    service: ServiceDep,
    ingrediente_id: UUID,
) -> None:
    """Elimina un ingrediente por su UUID."""
    try:
        await service.delete_ingrediente(ingrediente_id)
    except IngredienteNotFoundError as exc:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, INGREDIENTE_NO_ENCONTRADO
        ) from exc
    except IngredienteEnUsoError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, INGREDIENTE_EN_USO) from exc
