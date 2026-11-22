# AGENTS.md — Backend

## Contexto
[Breve descripción de qué hace este servicio/API y su dominio en 2-3 líneas.]

## Stack técnico
- **Lenguaje y gestor:** Python 3.12+, `uv`
- **Framework web:** FastAPI + Pydantic v2
- **ORM y driver PostgreSQL:** SQLAlchemy 2.0 (async) + `psycopg` (v3) (`postgresql+psycopg://`)
- **Migraciones:** Alembic
- **Calidad y testing:** `pytest`, `ruff`, `basedpyright`

## Comandos frecuentes (ejecutar desde `/apps/api`)
- **Sincronizar dependencias:** `uv sync`
- **Servidor en desarrollo:** `uv run fastapi dev src/main.py`
- **Tests completos:** `uv run pytest`
- **Test de un archivo:** `uv run pytest tests/test_archivo.py -v`
- **Linter y formato:** `uv run ruff check . --fix && uv run ruff format .`
- **Typecheck:** `uv run basedpyright`
- **Crear migración:** `uv run alembic revision --autogenerate -m "descripcion_corta"`
- **Aplicar migraciones:** `uv run alembic upgrade head`
- **Revertir última migración:** `uv run alembic downgrade -1`

## Estructura
Las rutas son relativas a `apps/api`. El código se organiza por módulo de negocio en `src/modules/` y los componentes compartidos viven en `src/shared/`.

- `src/main.py` define la aplicación FastAPI y registra los routers de cada módulo.
- `src/modules/productos/` agrupa el módulo de productos (usar como referencia para nuevos módulos):
  - `router.py` define los endpoints de `/productos`.
  - `schema.py` contiene los esquemas Pydantic de entrada y salida.
  - `producto.py` define la entidad de dominio `Producto` y el enum `Categoria`.
  - `producto_model.py` define el modelo SQLAlchemy `ProductoORM`.
  - `repository.py` implementa las consultas y escrituras de productos.
  - `service.py` contiene la clase `Service` del módulo.
- `src/shared/db.py` define la base declarativa, la fábrica de sesiones asíncronas y `unit_of_work`, que gestiona las transacciones.
- `src/shared/logger.py` contiene la configuración de logging y el adaptador `Logger`.
- `alembic.ini` y `alembic/env.py` configuran Alembic. Las migraciones viven en `alembic/versions/`.
- `tests/test_db.py` comprueba el commit y el rollback de `unit_of_work`.
- `project.json` define los targets de Nx. `pyproject.toml` y `uv.lock` gestionan la configuración de Python y sus dependencias.

## Convenciones de código

### FastAPI y Pydantic v2
- Los archivos `router.py` solo validan entrada/salida, inyectan dependencias y delegan en `service.py`. Prohibido escribir lógica de negocio o queries en los routers.
- Declarar siempre `response_model` explícito; nunca devolver modelos ORM (`*ORM`) directamente.
- Usar sintaxis Pydantic v2 (`model_validate`, `model_dump`, `ConfigDict(from_attributes=True)`). No usar métodos deprecados de v1 (`from_orm`, `.dict()`).
- Inyectar dependencias mediante `Depends(...)` o `Annotated[..., Depends(...)]`.
- Usar las skills instaladas de FastAPI para generar código.

### SQLAlchemy 2.0 (async), psycopg3 y arquitectura por módulos
- Usar exclusivamente sintaxis 2.0 asíncrona: `AsyncSession`, `select(...)`, `Mapped[...]` y `mapped_column(...)`. Prohibido `session.query(...)`.
- Mantener el dialecto `postgresql+psycopg://`; no introducir `psycopg2`.
- Encapsular todas las consultas y escrituras en el `repository.py` del módulo correspondiente; no hacer queries desde `service.py` ni `router.py`.
- Gestionar las transacciones (`commit` / `rollback`) exclusivamente mediante `unit_of_work` de `src/shared/db.py`. No llamar a `session.commit()` dentro de `repository.py`.
- No compartir instancias de `AsyncSession` en `BackgroundTasks` ni en variables globales.
- Evitar consultas N+1 y errores de lazy-loading en async usando `selectinload()` o `joinedload()` de forma explícita.
- Usar siempre parámetros vinculados en SQL crudo (`text(...)`); nunca interpolar variables.

### Migraciones, tipado y errores
- Revisar siempre las migraciones autogeneradas en `alembic/versions/` antes de darlas por válidas (índices, enums, `server_default`).
- No editar migraciones ya aplicadas en ramas compartidas; crear una nueva.
- Tipar todas las funciones públicas y evitar `Any`.
- Lanzar excepciones de dominio desde `service.py` y traducirlas a `HTTPException` en `router.py`.

## Flujo de trabajo
1. Revisar los archivos del módulo en `src/modules/` y `src/shared/` antes de crear código nuevo.
2. Mantener los cambios pequeños, atómicos y enfocados en la tarea.
3. Añadir o actualizar tests en `tests/` cubriendo el caso feliz y al menos un caso de error.
4. Ejecutar `uv run ruff check . --fix && uv run ruff format .`, `uv run basedpyright` y `uv run pytest` antes de finalizar.
5. Si un cambio altera modelos `*ORM`, indicar explícitamente si requiere migración de Alembic.
6. Usar siempre el MCP de Context7 si está disponible para consultar la documentación más actualizada de las dependencias.

## Límites y reglas de seguridad

### Hacer siempre
- Respetar el estilo y convenciones existentes en el archivo modificado.
- Validar entradas externas en los límites de la API con Pydantic.

### Preguntar antes de hacer
- Añadir o actualizar dependencias en `pyproject.toml`.
- Crear migraciones destructivas (`DROP TABLE`, `DROP COLUMN`, cambios de tipo incompatibles).
- Cambiar `src/shared/db.py` (engine, pool de conexiones, `unit_of_work`) o el sistema de autenticación.

### No hacer nunca
- Commitear secretos, tokens, archivos `.env` o dumps de base de datos.
- Usar `--no-verify` ni desactivar linters o `basedpyright` para forzar un build en verde.
- Inventar endpoints, variables de entorno o funciones inexistentes en el código.

## Lecciones aprendidas (No repetir)
Cuando el usuario te corrija un error, rechace un enfoque o te pida explícitamente que "anotes esto", añade una nueva regla concisa en esta sección antes de terminar la tarea.

**Formato obligatorio:** una sola línea accionable (`- **No hacer X → Hacer Y.**`), sin explicaciones largas ni contexto histórico. Si ya existe una regla similar, actualízala en lugar de duplicarla.

### Registro
- **No usar IDs enteros autoincrementales en nuevos modelos → Usar siempre `UUID` (`sqlalchemy.Uuid` con `uuid4`) como clave primaria.**