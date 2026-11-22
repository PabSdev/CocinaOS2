from uuid import UUID

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from shared.logger import Logger

from .plato import Plato
from .plato_model import PlatoORM
from .schema import PlatoCreate

logger = Logger(__name__)


def _to_domain_model(plato_orm: PlatoORM) -> Plato:
    return Plato(
        id=plato_orm.id,
        nombre=plato_orm.nombre,
        precio=plato_orm.precio,
        stock=plato_orm.stock,
        foto=plato_orm.foto,
        created_at=plato_orm.created_at,
        updated_at=plato_orm.updated_at,
    )


class PlatoRepository:
    """Ejecuta operaciones de persistencia de platos con la sesión del UoW."""

    def __init__(self, db: AsyncSession) -> None:
        self._db: AsyncSession = db

    async def get_platos(
        self, nombre: str | None = None, *, exacto: bool = False
    ) -> list[Plato]:
        query = select(PlatoORM)
        if nombre is not None:
            filtro = (
                PlatoORM.nombre == nombre
                if exacto
                else PlatoORM.nombre.icontains(nombre, autoescape=True)
            )
            query = query.where(filtro)
        query = query.order_by(PlatoORM.created_at.desc(), PlatoORM.id.desc())
        platos_orm = await self._db.scalars(query)
        return [_to_domain_model(item) for item in platos_orm]

    async def get_plato_by_id(
        self, plato_id: UUID, *, for_update: bool = False
    ) -> Plato | None:
        if for_update:
            plato_orm = await self._db.scalar(
                select(PlatoORM).where(PlatoORM.id == plato_id).with_for_update()
            )
        else:
            plato_orm = await self._db.get(PlatoORM, plato_id)
        return _to_domain_model(plato_orm) if plato_orm is not None else None

    async def create_plato(self, plato: PlatoCreate) -> Plato:
        plato_orm = PlatoORM(
            nombre=plato.nombre,
            precio=plato.precio,
            stock=plato.stock,
            foto=plato.foto,
        )
        self._db.add(plato_orm)
        await self._db.flush()
        await self._db.refresh(plato_orm)

        logger.debug("Plato insertado en la transacción con id %s", plato_orm.id)
        return _to_domain_model(plato_orm)

    async def update_plato(
        self, plato_id: UUID, changes: dict[str, object]
    ) -> Plato | None:
        if not changes:
            return await self.get_plato_by_id(plato_id)

        plato_orm = await self._db.scalar(
            update(PlatoORM)
            .where(PlatoORM.id == plato_id)
            .values(**changes, updated_at=func.now())
            .returning(PlatoORM)
        )
        return _to_domain_model(plato_orm) if plato_orm is not None else None

    async def delete_plato(self, plato_id: UUID) -> bool:
        eliminado = await self._db.scalar(
            delete(PlatoORM).where(PlatoORM.id == plato_id).returning(PlatoORM.id)
        )
        return eliminado is not None
