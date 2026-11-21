# Pre-commit

Desde `apps/api`, instala las dependencias de desarrollo y el hook:

```sh
uv sync
uv run pre-commit install
```

En cada commit se ejecutan, en orden, los targets `api:lint`, `api:test` y
`api:typecheck` de Nx. Este último ejecuta basedpyright para comprobar los tipos.
Si falla una comprobación, se cancela el commit. El hook necesita
el workspace Nx situado dos directorios por encima de `apps/api`.

En VS Code, instala la extensión BasedPyright para usarla como servidor de lenguaje.

## Transacciones

Configura `DATABASE_URL` con una URL de SQLAlchemy como
`postgresql+psycopg://usuario:contraseña@localhost/cocinaos`. El driver `psycopg`
utiliza `libpq` del sistema.

Abre una transacción por operación y pasa la misma sesión a sus repositorios.
Al salir del bloque, `unit_of_work` confirma los cambios o los revierte si hay
una excepción. En ambos casos cierra la sesión.

```python
from api.db import unit_of_work
from modules.productos.repository import ProductoRepository

async with unit_of_work() as session:
    productos = await ProductoRepository(session).get_productos()
```
