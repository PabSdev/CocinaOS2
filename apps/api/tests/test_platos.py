from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import override
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from pydantic import TypeAdapter

from main import app
from modules.platos.plato import Plato, PlatoNotFoundError
from modules.platos.router import get_plato_service
from modules.platos.schema import PlatoCreate, PlatoResponse, PlatoUpdate
from modules.platos.service import PlatoService

_LIST_RESPONSE_ADAPTER = TypeAdapter(list[PlatoResponse])


class FakePlatoService(PlatoService):
    def __init__(self) -> None:
        self._items: dict[UUID, Plato] = {}

    @override
    async def get_platos(
        self, nombre: str | None = None, *, exacto: bool = False
    ) -> list[Plato]:
        items = list(self._items.values())
        if nombre is not None:
            items = [
                item
                for item in items
                if (
                    item.nombre == nombre
                    if exacto
                    else nombre.lower() in item.nombre.lower()
                )
            ]
        return sorted(items, key=lambda item: item.created_at, reverse=True)

    @override
    async def get_plato_by_id(self, plato_id: UUID) -> Plato:
        plato = self._items.get(plato_id)
        if plato is None:
            raise PlatoNotFoundError(plato_id)
        return plato

    @override
    async def create_plato(self, plato: PlatoCreate) -> Plato:
        now = datetime.now(UTC)
        created = Plato(
            id=uuid4(),
            nombre=plato.nombre,
            precio=plato.precio,
            stock=plato.stock,
            foto=plato.foto,
            created_at=now,
            updated_at=now,
        )
        self._items[created.id] = created
        return created

    @override
    async def update_plato(self, plato_id: UUID, plato: PlatoUpdate) -> Plato:
        current = self._items.get(plato_id)
        if current is None:
            raise PlatoNotFoundError(plato_id)

        fields = plato.model_fields_set
        updated = Plato(
            id=current.id,
            nombre=(
                plato.nombre
                if "nombre" in fields and plato.nombre is not None
                else current.nombre
            ),
            precio=(
                plato.precio
                if "precio" in fields and plato.precio is not None
                else current.precio
            ),
            stock=(
                plato.stock
                if "stock" in fields and plato.stock is not None
                else current.stock
            ),
            foto=plato.foto if "foto" in fields else current.foto,
            created_at=current.created_at,
            updated_at=current.updated_at + timedelta(seconds=1),
        )
        self._items[plato_id] = updated
        return updated

    @override
    async def delete_plato(self, plato_id: UUID) -> None:
        if plato_id not in self._items:
            raise PlatoNotFoundError(plato_id)
        del self._items[plato_id]


@pytest.fixture
def client() -> Iterator[TestClient]:
    service = FakePlatoService()
    app.dependency_overrides[get_plato_service] = lambda: service
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_platos_crud_flow(client: TestClient) -> None:
    create_response = client.post(
        "/platos/",
        json={
            "nombre": "  Tortilla de patatas  ",
            "precio": "8.50",
            "stock": 12,
            "foto": "https://cdn.example.com/tortilla.jpg",
        },
    )
    assert create_response.status_code == 201
    created = PlatoResponse.model_validate(create_response.json())
    assert created.nombre == "Tortilla de patatas"
    assert created.precio == Decimal("8.50")
    assert created.stock == 12
    assert created.foto == "https://cdn.example.com/tortilla.jpg"

    list_response = client.get("/platos/", params={"nombre": "tortilla"})
    assert list_response.status_code == 200
    items = _LIST_RESPONSE_ADAPTER.validate_python(list_response.json())
    assert len(items) == 1
    assert items[0].id == created.id

    get_response = client.get(f"/platos/{created.id}")
    assert get_response.status_code == 200
    assert PlatoResponse.model_validate(get_response.json()).id == created.id

    patch_response = client.patch(
        f"/platos/{created.id}",
        json={"precio": "9.25", "foto": None},
    )
    assert patch_response.status_code == 200
    updated = PlatoResponse.model_validate(patch_response.json())
    assert updated.precio == Decimal("9.25")
    assert updated.foto is None

    delete_response = client.delete(f"/platos/{created.id}")
    assert delete_response.status_code == 204

    missing_response = client.get(f"/platos/{created.id}")
    assert missing_response.status_code == 404


def test_platos_validation_errors(client: TestClient) -> None:
    assert client.post("/platos/", json={"nombre": "   "}).status_code == 422
    assert (
        client.post("/platos/", json={"nombre": "Sopa", "precio": "-1"}).status_code
        == 422
    )
    assert (
        client.post("/platos/", json={"nombre": "Sopa", "stock": -2}).status_code == 422
    )
    assert client.get(f"/platos/{uuid4()}").status_code == 404
    assert client.patch(f"/platos/{uuid4()}", json={"precio": None}).status_code == 422
