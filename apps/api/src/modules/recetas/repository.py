from decimal import Decimal
from uuid import UUID

from sqlalchemy import Select, delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from modules.ingredientes.ingrediente import UnidadDeMasa
from shared.logger import Logger

from .receta import (
    RecetaIngredienteResumen,
    RecetaLinea,
    RecetaPlatoResumen,
)
from .receta_model import RecetaORM
from .schema import RecetaLineaSync

logger = Logger(__name__)


def _to_domain_model(receta_orm: RecetaORM) -> RecetaLinea:
    plato_orm = receta_orm.plato
    ingrediente_orm = receta_orm.ingrediente
    return RecetaLinea(
        id=receta_orm.id,
        plato_id=receta_orm.plato_id,
        ingrediente_id=receta_orm.ingrediente_id,
        cantidad=receta_orm.cantidad,
        unidad=UnidadDeMasa(receta_orm.unidad),
        merma_ingrediente_receta=receta_orm.merma_ingrediente_receta,
        created_at=receta_orm.created_at,
        updated_at=receta_orm.updated_at,
        plato=RecetaPlatoResumen(
            id=plato_orm.id,
            nombre=plato_orm.nombre,
            precio=plato_orm.precio,
            foto=plato_orm.foto,
            stock=plato_orm.stock,
        ),
        ingrediente=RecetaIngredienteResumen(
            id=ingrediente_orm.id,
            nombre=ingrediente_orm.nombre,
            descripcion=ingrediente_orm.descripcion,
            stock=ingrediente_orm.stock,
            unidad_de_masa=UnidadDeMasa(ingrediente_orm.unidad_de_masa),
            precio_compra=ingrediente_orm.precio_compra,
            merma_habitual=ingrediente_orm.merma_habitual,
        ),
    )


class RecetaRepository:
    """Ejecuta operaciones de persistencia de recetas con la sesión del UoW."""

    def __init__(self, db: AsyncSession) -> None:
        self._db: AsyncSession = db

    def _base_query(self) -> Select[RecetaORM]:
        return select(RecetaORM).options(
            joinedload(RecetaORM.plato),
            joinedload(RecetaORM.ingrediente),
        )

    async def get_recetas(
        self,
        plato_id: UUID | None = None,
        ingrediente_id: UUID | None = None,
    ) -> list[RecetaLinea]:
        query = self._base_query()
        if plato_id is not None:
            query = query.where(RecetaORM.plato_id == plato_id)
        if ingrediente_id is not None:
            query = query.where(RecetaORM.ingrediente_id == ingrediente_id)
        query = query.order_by(RecetaORM.created_at.desc(), RecetaORM.id.desc())
        rows = await self._db.scalars(query)
        return [_to_domain_model(item) for item in rows]

    async def get_receta_by_id(self, receta_id: UUID) -> RecetaLinea | None:
        row = await self._db.scalar(self._base_query().where(RecetaORM.id == receta_id))
        return _to_domain_model(row) if row is not None else None

    async def get_by_plato_and_ingrediente(
        self, plato_id: UUID, ingrediente_id: UUID
    ) -> RecetaLinea | None:
        row = await self._db.scalar(
            self._base_query().where(
                RecetaORM.plato_id == plato_id,
                RecetaORM.ingrediente_id == ingrediente_id,
            )
        )
        return _to_domain_model(row) if row is not None else None

    async def create_receta(
        self,
        plato_id: UUID,
        ingrediente_id: UUID,
        cantidad: Decimal,
        unidad: UnidadDeMasa,
        merma_ingrediente_receta: Decimal | None,
    ) -> RecetaLinea:
        receta_orm = RecetaORM(
            plato_id=plato_id,
            ingrediente_id=ingrediente_id,
            cantidad=cantidad,
            unidad=unidad.value,
            merma_ingrediente_receta=merma_ingrediente_receta,
        )
        self._db.add(receta_orm)
        await self._db.flush()
        logger.debug("Línea de receta insertada con id %s", receta_orm.id)
        loaded = await self.get_receta_by_id(receta_orm.id)
        if loaded is None:
            raise RuntimeError("No se pudo recargar la línea de receta creada.")
        return loaded

    async def update_receta(
        self, receta_id: UUID, changes: dict[str, object]
    ) -> RecetaLinea | None:
        if not changes:
            return await self.get_receta_by_id(receta_id)

        updated_id = await self._db.scalar(
            update(RecetaORM)
            .where(RecetaORM.id == receta_id)
            .values(**changes, updated_at=func.now())
            .returning(RecetaORM.id)
        )
        if updated_id is None:
            return None
        return await self.get_receta_by_id(updated_id)

    async def delete_receta(self, receta_id: UUID) -> bool:
        eliminado = await self._db.scalar(
            delete(RecetaORM).where(RecetaORM.id == receta_id).returning(RecetaORM.id)
        )
        return eliminado is not None

    async def sync_plato_receta(
        self,
        plato_id: UUID,
        current_lines: list[RecetaLinea],
        target_lines: list[RecetaLineaSync],
    ) -> list[RecetaLinea]:
        current_by_id = {line.id: line for line in current_lines}
        retained_ids = {line.id for line in target_lines if line.id is not None}
        removed_ids = [line.id for line in current_lines if line.id not in retained_ids]

        # Evita UniqueViolation temporal al intercambiar ingrediente_id entre líneas retenidas.
        retained_current_ingredients = {
            current_by_id[line_id].ingrediente_id for line_id in retained_ids
        }
        reinsert_ids: set[UUID] = {
            line.id
            for line in target_lines
            if line.id is not None
            and current_by_id[line.id].ingrediente_id != line.ingrediente_id
            and line.ingrediente_id in retained_current_ingredients
        }

        delete_ids = removed_ids + list(reinsert_ids)
        if delete_ids:
            _ = await self._db.execute(
                delete(RecetaORM).where(RecetaORM.id.in_(delete_ids))
            )
            await self._db.flush()

        for line in target_lines:
            if line.id is not None and line.id not in reinsert_ids:
                prev = current_by_id[line.id]
                if (
                    prev.ingrediente_id == line.ingrediente_id
                    and prev.cantidad == line.cantidad
                    and prev.unidad == line.unidad
                    and prev.merma_ingrediente_receta == line.merma_ingrediente_receta
                ):
                    continue
                _ = await self._db.execute(
                    update(RecetaORM)
                    .where(RecetaORM.id == line.id)
                    .values(
                        ingrediente_id=line.ingrediente_id,
                        cantidad=line.cantidad,
                        unidad=line.unidad.value,
                        merma_ingrediente_receta=line.merma_ingrediente_receta,
                        updated_at=func.now(),
                    )
                )
            elif line.id is not None:
                prev = current_by_id[line.id]
                self._db.add(
                    RecetaORM(
                        id=prev.id,
                        plato_id=plato_id,
                        ingrediente_id=line.ingrediente_id,
                        cantidad=line.cantidad,
                        unidad=line.unidad.value,
                        merma_ingrediente_receta=line.merma_ingrediente_receta,
                        created_at=prev.created_at,
                    )
                )
            else:
                self._db.add(
                    RecetaORM(
                        plato_id=plato_id,
                        ingrediente_id=line.ingrediente_id,
                        cantidad=line.cantidad,
                        unidad=line.unidad.value,
                        merma_ingrediente_receta=line.merma_ingrediente_receta,
                    )
                )

        await self._db.flush()
        return await self.get_recetas(plato_id=plato_id)
