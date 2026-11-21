# CocinaOS

CocinaOS es un monorepo gestionado con Nx. La configuración del workspace está en `nx.json`.

- `apps/api` contiene el backend FastAPI, registrado en Nx como `api`. La aplicación arranca desde `apps/api/src/main.py` y usa `uv` para gestionar las dependencias de Python.
- `apps/web` está reservado para el frontend Next.js. La carpeta todavía está vacía. Consulta `./nx show projects` antes de usar un target del frontend.

## Instrucciones por proyecto

Cada proyecto debe tener su propio `AGENTS.md` en la raíz de su carpeta. Antes de trabajar en un proyecto, lee su archivo y aplica sus instrucciones junto con las de este documento. Si la tarea afecta a varios proyectos, consulta el archivo de cada uno y sigue sus instrucciones en la parte correspondiente. Las indicaciones del proyecto tienen prioridad dentro de su carpeta.

- Para el backend, consulta `apps/api/AGENTS.MD`.
- Para el frontend, consulta `apps/web/AGENTS.md` cuando se incorpore el proyecto.

## Comandos de Nx

Ejecuta los comandos desde la raíz con `./nx` (`.\nx.bat` en Windows). Este script usa la versión de Nx declarada en `nx.json`.

| Comando | Para qué sirve |
| --- | --- |
| `./nx show projects` | Lista los proyectos registrados. |
| `./nx show project api --json` | Muestra la configuración efectiva de `api` y sus targets. |
| `./nx run api:dev` | Arranca FastAPI con Uvicorn y recarga automática. |
| `./nx run api:test` | Ejecuta las pruebas con pytest. |
| `./nx run api:check-lint` | Comprueba el código con Ruff. |
| `./nx run api:lint` | Ejecuta Ruff con correcciones automáticas. |
| `./nx run api:typecheck` | Comprueba los tipos con BasedPyright. |
| `./nx run-many -t test` | Ejecuta `test` en todos los proyectos que tienen ese target. |
| `./nx graph --print` | Muestra el grafo de dependencias en la terminal. |
| `./nx affected -t test --base=<base> --head=<head>` | Ejecuta `test` en los proyectos afectados entre dos referencias de Git. Sustituye los marcadores por referencias válidas del monorepo. |

Usa `nx run` para un proyecto, `run-many` para varios y `affected` cuando quieras incluir solo los proyectos modificados y sus dependientes. Consulta los targets con `show project` antes de ejecutarlos. Si el entorno bloquea los sockets de Nx, antepón `NX_DAEMON=false NX_ISOLATE_PLUGINS=false` al comando.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax


<!-- nx configuration end-->
