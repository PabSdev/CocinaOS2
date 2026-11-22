from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.routing import APIRoute

from modules.ingredientes.router import router as ingredientes_router
from modules.platos.router import router as platos_router
from modules.productos.router import router as productos_router
from modules.recetas.router import router as recetas_router

_ = load_dotenv(Path(__file__).resolve().parent.parent / ".env")


def custom_generate_unique_id(route: APIRoute) -> str:
    if route.tags:
        return f"{route.tags[0]}-{route.name}"
    return route.name


app = FastAPI(
    title="CocinaOS API",
    generate_unique_id_function=custom_generate_unique_id,
)

app.include_router(ingredientes_router)
app.include_router(platos_router)
app.include_router(productos_router)
app.include_router(recetas_router)
