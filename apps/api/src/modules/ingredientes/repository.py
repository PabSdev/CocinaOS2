from uuid import UUID

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from shared.logger import Logger

from .ingrediente import Ingrediente, UnidadDeMasa
from .ingrediente_model import IngredienteORM
from .schema import IngredienteCreate

logger = Logger(__name__)


def _to_domain_model(ingrediente_orm: IngredienteORM) -> Ingrediente:
    return Ingrediente(
        id=ingrediente_orm.id,
        nombre=ingrediente_orm.nombre,
        descripcion=ingrediente_orm.descripcion,
        stock=ingrediente_orm.stock,
        unidad_de_masa=UnidadDeMasa(ingrediente_orm.unidad_de_masa),
        precio_compra=ingrediente_orm.precio_compra,
        merma_habitual=ingrediente_orm.merma_habitual,
        created_at=ingrediente_orm.created_at,
        updated_at=ingrediente_orm.updated_at,
    )


class IngredienteRepository:
    """Ejecuta operaciones de persistencia con la sesión del UoW."""

    def __init__(self, db: AsyncSession) -> None:
        self._db: AsyncSession = db

    async def get_ingredientes(
        self, nombre: str | None = None, *, exacto: bool = False
    ) -> list[Ingrediente]:
        query = select(IngredienteORM)
        if nombre is not None:
            filtro = (
                IngredienteORM.nombre == nombre
                if exacto
                else IngredienteORM.nombre.icontains(nombre, autoescape=True)
            )
            query = query.where(filtro)
        query = query.order_by(
            IngredienteORM.created_at.desc(), IngredienteORM.id.desc()
        )
        ingredientes_orm = await self._db.scalars(query)
        return [_to_domain_model(item) for item in ingredientes_orm]

    async def get_ingrediente_by_id(self, ingrediente_id: UUID) -> Ingrediente | None:
        ingrediente_orm = await self._db.get(IngredienteORM, ingrediente_id)
        return (
            _to_domain_model(ingrediente_orm) if ingrediente_orm is not None else None
        )

    async def get_ingredientes_by_ids(
        self, ingrediente_ids: set[UUID]
    ) -> list[Ingrediente]:
        if not ingrediente_ids:
            return []
        rows = await self._db.scalars(
            select(IngredienteORM).where(IngredienteORM.id.in_(ingrediente_ids))
        )
        return [_to_domain_model(item) for item in rows]

    async def create_ingrediente(self, ingrediente: IngredienteCreate) -> Ingrediente:
        ingrediente_orm = IngredienteORM(
            nombre=ingrediente.nombre,
            descripcion=ingrediente.descripcion,
            stock=ingrediente.stock,
            unidad_de_masa=ingrediente.unidad_de_masa.value,
            precio_compra=ingrediente.precio_compra,
            merma_habitual=ingrediente.merma_habitual,
        )
        self._db.add(ingrediente_orm)
        await self._db.flush()
        await self._db.refresh(ingrediente_orm)

        logger.debug(
            "Ingrediente insertado en la transacción con id %s",
            ingrediente_orm.id,
        )

        return _to_domain_model(ingrediente_orm)

    async def update_ingrediente(
        self, ingrediente_id: UUID, changes: dict[str, object]
    ) -> Ingrediente | None:
        if not changes:
            return await self.get_ingrediente_by_id(ingrediente_id)

        ingrediente_orm = await self._db.scalar(
            update(IngredienteORM)
            .where(IngredienteORM.id == ingrediente_id)
            .values(**changes, updated_at=func.now())
            .returning(IngredienteORM)
        )
        return (
            _to_domain_model(ingrediente_orm) if ingrediente_orm is not None else None
        )

    async def delete_ingrediente(self, ingrediente_id: UUID) -> bool:
        eliminado = await self._db.scalar(
            delete(IngredienteORM)
            .where(IngredienteORM.id == ingrediente_id)
            .returning(IngredienteORM.id)
        )
        return eliminado is not None
