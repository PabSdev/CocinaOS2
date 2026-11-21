from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from functools import cache
from os import environ

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Clase base para los modelos de SQLAlchemy."""
    pass

@cache
def _session_factory() -> async_sessionmaker[AsyncSession]:
    engine = create_async_engine(environ["DATABASE_URL"])
    return async_sessionmaker(engine, autobegin=False)


@asynccontextmanager
async def unit_of_work() -> AsyncGenerator[AsyncSession]:
    """Comparte una transacción entre los repositorios de una operación."""
    async with _session_factory().begin() as session:
        yield session
