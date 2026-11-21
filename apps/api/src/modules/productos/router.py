from fastapi import APIRouter, HTTPException, status

from shared.db import unit_of_work

from .producto import Producto
from .repository import ProductoRepository
from .schema import ProductoCreate, ProductoResponse, ProductoUpdate

router = APIRouter(prefix="/productos", tags=["productos"])

PRODUCTO_NO_ENCONTRADO = "Producto no encontrado"
RESPUESTA_404: dict[int | str, dict[str, object]] = {
    status.HTTP_404_NOT_FOUND: {
        "description": PRODUCTO_NO_ENCONTRADO,
        "content": {
            "application/json": {"example": {"detail": PRODUCTO_NO_ENCONTRADO}}
        },
    }
}


@router.get("/", response_model=list[ProductoResponse])
async def get_productos(
    nombre: str | None = None, exacto: bool = False
) -> list[Producto]:
    """Filtra por coincidencia parcial o, con exacto=true, por el nombre completo."""
    async with unit_of_work() as session:
        return await ProductoRepository(session).get_productos(nombre, exacto=exacto)


@router.post("/", response_model=ProductoResponse, status_code=status.HTTP_201_CREATED)
async def create_producto(producto: ProductoCreate) -> Producto:
    async with unit_of_work() as session:
        return await ProductoRepository(session).create_producto(producto)


@router.get(
    "/{producto_nombre}", response_model=ProductoResponse, responses=RESPUESTA_404
)
async def get_producto(producto_nombre: str) -> Producto:
    """Obtiene un producto por su nombre."""
    async with unit_of_work() as session:
        producto = await ProductoRepository(session).get_producto_by_nombre(
            producto_nombre
        )
    if producto is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, PRODUCTO_NO_ENCONTRADO)
    return producto


@router.get(
    "/id/{producto_id}", response_model=ProductoResponse, responses=RESPUESTA_404
)
async def get_producto_by_id(producto_id: int) -> Producto:
    async with unit_of_work() as session:
        producto = await ProductoRepository(session).get_producto_by_id(producto_id)
    if producto is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, PRODUCTO_NO_ENCONTRADO)
    return producto


@router.put(
    "/id/{producto_id}", response_model=ProductoResponse, responses=RESPUESTA_404
)
async def update_producto(producto_id: int, producto: ProductoUpdate) -> Producto:
    async with unit_of_work() as session:
        actualizado = await ProductoRepository(session).update_producto(
            producto_id, producto
        )
    if actualizado is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, PRODUCTO_NO_ENCONTRADO)
    return actualizado


@router.delete(
    "/id/{producto_id}", status_code=status.HTTP_204_NO_CONTENT, responses=RESPUESTA_404
)
async def delete_producto(producto_id: int) -> None:
    async with unit_of_work() as session:
        eliminado = await ProductoRepository(session).delete_producto(producto_id)
    if not eliminado:
        raise HTTPException(status.HTTP_404_NOT_FOUND, PRODUCTO_NO_ENCONTRADO)
