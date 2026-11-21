from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from shared.logger import Logger

from .producto import Categoria, Producto
from .producto_model import ProductoORM
from .schema import ProductoBase, ProductoCreate, ProductoUpdate

logger = Logger(__name__)


def _to_domain_model(producto_orm: ProductoORM) -> Producto:
    return Producto(
        id=producto_orm.id,
        nombre=producto_orm.nombre,
        precio=producto_orm.precio,
        precio_compra=producto_orm.precio_compra,
        categoria=Categoria(producto_orm.categoria),
        stock=producto_orm.stock,
        foto=producto_orm.foto,
    )


def _to_orm_values(producto: ProductoBase) -> dict[str, object]:
    return {
        "nombre": producto.nombre,
        "precio": producto.precio,
        "precio_compra": producto.precio_compra,
        "categoria": producto.categoria.value,
        "stock": producto.stock,
        "foto": producto.foto,
    }


class ProductoRepository:
    """Ejecuta operaciones con la sesión que proporciona el UoW."""

    def __init__(self, db: AsyncSession) -> None:
        self._db: AsyncSession = db

    async def get_productos(
        self, nombre: str | None = None, *, exacto: bool = False
    ) -> list[Producto]:
        query = select(ProductoORM)
        if nombre is not None:
            filtro = (
                ProductoORM.nombre == nombre
                if exacto
                else ProductoORM.nombre.icontains(nombre, autoescape=True)
            )
            query = query.where(filtro)
        productos_orm = await self._db.scalars(query)
        return [_to_domain_model(producto_orm) for producto_orm in productos_orm]

    async def get_producto_by_nombre(self, producto_nombre: str) -> Producto | None:
        result = await self._db.scalars(
            select(ProductoORM)
            .where(ProductoORM.nombre == producto_nombre)
            .order_by(ProductoORM.id)
            .limit(1)
        )
        producto_orm = result.first()
        return _to_domain_model(producto_orm) if producto_orm is not None else None

    async def get_producto_by_id(self, producto_id: int) -> Producto | None:
        producto_orm = await self._db.get(ProductoORM, producto_id)
        return _to_domain_model(producto_orm) if producto_orm is not None else None

    async def delete_producto(self, producto_id: int) -> bool:
        eliminado = await self._db.scalar(
            delete(ProductoORM)
            .where(ProductoORM.id == producto_id)
            .returning(ProductoORM.id)
        )
        return eliminado is not None

    async def update_producto(
        self, producto_id: int, producto: ProductoUpdate
    ) -> Producto | None:
        producto_orm = await self._db.scalar(
            update(ProductoORM)
            .where(ProductoORM.id == producto_id)
            .values(**_to_orm_values(producto))
            .returning(ProductoORM)
        )
        return _to_domain_model(producto_orm) if producto_orm is not None else None

    async def create_producto(self, producto: ProductoCreate) -> Producto:
        producto_orm = ProductoORM(**_to_orm_values(producto))

        self._db.add(producto_orm)
        await self._db.flush()

        logger.debug(
            "Producto insertado en la transacción con id %s",
            producto_orm.id,
        )

        return _to_domain_model(producto_orm)
