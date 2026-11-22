from asyncio import run
from collections.abc import AsyncGenerator, Iterator
from contextlib import asynccontextmanager
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import override
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from pydantic import TypeAdapter

from main import app
from modules.ingredientes import service as service_module
from modules.ingredientes.ingrediente import (
    Ingrediente,
    IngredienteNotFoundError,
    UnidadDeMasa,
)
from modules.ingredientes.router import get_ingrediente_service
from modules.ingredientes.schema import (
    IngredienteCreate,
    IngredienteResponse,
    IngredienteUpdate,
)
from modules.ingredientes.service import IngredienteService

_LIST_RESPONSE_ADAPTER = TypeAdapter(list[IngredienteResponse])


class FakeIngredienteService(IngredienteService):
    def __init__(self) -> None:
        self._items: dict[UUID, Ingrediente] = {}

    @override
    async def get_ingredientes(
        self, nombre: str | None = None, *, exacto: bool = False
    ) -> list[Ingrediente]:
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
    async def get_ingrediente_by_id(self, ingrediente_id: UUID) -> Ingrediente:
        ingrediente = self._items.get(ingrediente_id)
        if ingrediente is None:
            raise IngredienteNotFoundError(ingrediente_id)
        return ingrediente

    @override
    async def create_ingrediente(self, ingrediente: IngredienteCreate) -> Ingrediente:
        now = datetime.now(UTC)
        created = Ingrediente(
            id=uuid4(),
            nombre=ingrediente.nombre,
            descripcion=ingrediente.descripcion,
            stock=ingrediente.stock,
            unidad_de_masa=ingrediente.unidad_de_masa,
            precio_compra=ingrediente.precio_compra,
            merma_habitual=ingrediente.merma_habitual,
            created_at=now,
            updated_at=now,
        )
        self._items[created.id] = created
        return created

    @override
    async def update_ingrediente(
        self, ingrediente_id: UUID, ingrediente: IngredienteUpdate
    ) -> Ingrediente:
        current = self._items.get(ingrediente_id)
        if current is None:
            raise IngredienteNotFoundError(ingrediente_id)

        fields = ingrediente.model_fields_set
        updated = Ingrediente(
            id=current.id,
            nombre=(
                ingrediente.nombre
                if "nombre" in fields and ingrediente.nombre is not None
                else current.nombre
            ),
            descripcion=(
                ingrediente.descripcion
                if "descripcion" in fields
                else current.descripcion
            ),
            stock=(
                ingrediente.stock
                if "stock" in fields and ingrediente.stock is not None
                else current.stock
            ),
            unidad_de_masa=(
                ingrediente.unidad_de_masa
                if "unidad_de_masa" in fields and ingrediente.unidad_de_masa is not None
                else current.unidad_de_masa
            ),
            precio_compra=(
                ingrediente.precio_compra
                if "precio_compra" in fields
                else current.precio_compra
            ),
            merma_habitual=(
                ingrediente.merma_habitual
                if "merma_habitual" in fields
                else current.merma_habitual
            ),
            created_at=current.created_at,
            updated_at=current.updated_at + timedelta(seconds=1),
        )
        self._items[ingrediente_id] = updated
        return updated

    @override
    async def delete_ingrediente(self, ingrediente_id: UUID) -> None:
        if ingrediente_id not in self._items:
            raise IngredienteNotFoundError(ingrediente_id)
        del self._items[ingrediente_id]


@pytest.fixture
def client() -> Iterator[TestClient]:
    fake_service = FakeIngredienteService()
    app.dependency_overrides[get_ingrediente_service] = lambda: fake_service
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_ingredientes_crud_y_patch_parcial(client: TestClient) -> None:
    empty_response = client.get("/ingredientes/")
    assert empty_response.status_code == 200
    assert empty_response.json() == []

    create_response = client.post(
        "/ingredientes/",
        json={
            "nombre": "  Harina de trigo 00  ",
            "descripcion": "  Molino artesanal  ",
            "stock": "2.5000",
            "unidad_de_masa": "KG",
            "precio_compra": "3.1235",
            "merma_habitual": "5.00",
        },
    )
    assert create_response.status_code == 201
    created = IngredienteResponse.model_validate_json(create_response.content)
    assert created.nombre == "Harina de trigo 00"
    assert created.descripcion == "Molino artesanal"
    assert created.stock == Decimal("2.5000")
    assert created.unidad_de_masa == UnidadDeMasa.KG
    assert created.precio_compra == Decimal("3.1235")
    assert created.merma_habitual == Decimal("5.00")

    list_response = client.get("/ingredientes/", params={"nombre": "harina"})
    assert list_response.status_code == 200
    listed = _LIST_RESPONSE_ADAPTER.validate_json(list_response.content)
    assert len(listed) == 1

    exact_miss = client.get(
        "/ingredientes/", params={"nombre": "harina", "exacto": True}
    )
    assert exact_miss.status_code == 200
    assert exact_miss.json() == []

    get_response = client.get(f"/ingredientes/{created.id}")
    assert get_response.status_code == 200
    fetched = IngredienteResponse.model_validate_json(get_response.content)
    assert fetched.id == created.id

    patch_response = client.patch(
        f"/ingredientes/{created.id}",
        json={
            "stock": "4.25",
            "descripcion": None,
            "precio_compra": None,
        },
    )
    assert patch_response.status_code == 200
    patched = IngredienteResponse.model_validate_json(patch_response.content)
    assert patched.nombre == "Harina de trigo 00"
    assert patched.unidad_de_masa == UnidadDeMasa.KG
    assert patched.stock == Decimal("4.25")
    assert patched.descripcion is None
    assert patched.precio_compra is None
    assert patched.merma_habitual == Decimal("5.00")

    delete_response = client.delete(f"/ingredientes/{created.id}")
    assert delete_response.status_code == 204

    after_delete = client.get(f"/ingredientes/{created.id}")
    assert after_delete.status_code == 404


def test_ingredientes_not_found(client: TestClient) -> None:
    missing_id = uuid4()

    assert client.get(f"/ingredientes/{missing_id}").status_code == 404
    assert (
        client.patch(
            f"/ingredientes/{missing_id}",
            json={"nombre": "Sal"},
        ).status_code
        == 404
    )
    assert client.delete(f"/ingredientes/{missing_id}").status_code == 404


@pytest.mark.parametrize(
    "payload",
    [
        {"nombre": "   ", "stock": 1, "unidad_de_masa": "KG"},
        {"nombre": "Sal", "stock": -1, "unidad_de_masa": "KG"},
        {"nombre": "Sal", "stock": 1, "unidad_de_masa": "ONZAS"},
        {
            "nombre": "Sal",
            "stock": 1,
            "unidad_de_masa": "KG",
            "precio_compra": -0.5,
        },
        {
            "nombre": "Sal",
            "stock": 1,
            "unidad_de_masa": "KG",
            "merma_habitual": 100,
        },
    ],
)
def test_create_ingrediente_validacion_422(
    client: TestClient, payload: dict[str, object]
) -> None:
    response = client.post("/ingredientes/", json=payload)
    assert response.status_code == 422


def test_update_y_path_validacion_422(client: TestClient) -> None:
    assert client.get("/ingredientes/no-es-uuid").status_code == 422

    create_response = client.post(
        "/ingredientes/",
        json={"nombre": "Aceite", "stock": 3, "unidad_de_masa": "L"},
    )
    created = IngredienteResponse.model_validate_json(create_response.content)

    for field in ("nombre", "stock", "unidad_de_masa"):
        response = client.patch(
            f"/ingredientes/{created.id}",
            json={field: None},
        )
        assert response.status_code == 422

    empty_name = client.patch(
        f"/ingredientes/{created.id}",
        json={"nombre": "   "},
    )
    assert empty_name.status_code == 422


def test_ingrediente_service_delegacion_y_not_found(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    recorded_calls: list[tuple[str, object]] = []
    target_id = uuid4()
    now = datetime.now(UTC)

    @asynccontextmanager
    async def fake_uow() -> AsyncGenerator[object]:
        yield object()

    class StubRepository:
        def __init__(self, _: object) -> None:
            pass

        async def get_ingrediente_by_id(
            self, ingrediente_id: UUID
        ) -> Ingrediente | None:
            recorded_calls.append(("get", ingrediente_id))
            return None

        async def update_ingrediente(
            self, ingrediente_id: UUID, changes: dict[str, object]
        ) -> Ingrediente | None:
            recorded_calls.append(("update", (ingrediente_id, changes)))
            if ingrediente_id != target_id:
                return None
            return Ingrediente(
                id=target_id,
                nombre="Pimienta",
                descripcion=None,
                stock=Decimal(2),
                unidad_de_masa=UnidadDeMasa.G,
                precio_compra=None,
                merma_habitual=None,
                created_at=now,
                updated_at=now,
            )

        async def delete_ingrediente(self, ingrediente_id: UUID) -> bool:
            recorded_calls.append(("delete", ingrediente_id))
            return False

    monkeypatch.setattr(service_module, "unit_of_work", fake_uow)
    monkeypatch.setattr(service_module, "IngredienteRepository", StubRepository)

    svc = IngredienteService()

    async def exercise() -> None:
        updated = await svc.update_ingrediente(
            target_id,
            IngredienteUpdate(
                unidad_de_masa=UnidadDeMasa.G,
                precio_compra=None,
            ),
        )
        assert updated.id == target_id
        assert recorded_calls[-1] == (
            "update",
            (target_id, {"unidad_de_masa": "G", "precio_compra": None}),
        )

        with pytest.raises(IngredienteNotFoundError):
            _ = await svc.get_ingrediente_by_id(target_id)

        with pytest.raises(IngredienteNotFoundError):
            _ = await svc.update_ingrediente(uuid4(), IngredienteUpdate(nombre="Otro"))

        with pytest.raises(IngredienteNotFoundError):
            await svc.delete_ingrediente(target_id)

    run(exercise())
