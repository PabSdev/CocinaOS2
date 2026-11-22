from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import final, override
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from pydantic import TypeAdapter

from main import app
from modules.ingredientes.ingrediente import Ingrediente, UnidadDeMasa
from modules.platos.plato import Plato
from modules.recetas.receta import (
    IngredienteDuplicadoEnRecetaError,
    IngredienteNoExisteError,
    PlatoNoExisteError,
    RecetaConflictError,
    RecetaEscandallo,
    RecetaIngredienteResumen,
    RecetaLinea,
    RecetaPlatoResumen,
    UnidadIncompatibleError,
    are_units_compatible,
)
from modules.recetas.router import get_receta_service
from modules.recetas.schema import (
    RecetaEscandalloResponse,
    RecetaPlatoSyncRequest,
    RecetaResponse,
)
from modules.recetas.service import RecetaService, build_escandallo_version

_LIST_RESPONSE_ADAPTER = TypeAdapter(list[RecetaResponse])


@final
class FakeRecetaService(RecetaService):
    def __init__(self) -> None:
        now = datetime.now(UTC)
        self.plato = Plato(
            id=uuid4(),
            nombre="Tortilla de patatas",
            precio=Decimal("8.50"),
            stock=10,
            foto=None,
            created_at=now,
            updated_at=now,
        )
        self.ing_huevo = Ingrediente(
            id=uuid4(),
            nombre="Huevo",
            descripcion=None,
            stock=Decimal("20.0000"),
            unidad_de_masa=UnidadDeMasa.KG,
            precio_compra=Decimal("3.2000"),
            merma_habitual=Decimal("5.00"),
            created_at=now,
            updated_at=now,
        )
        self.ing_aceite = Ingrediente(
            id=uuid4(),
            nombre="Aceite de oliva",
            descripcion=None,
            stock=Decimal("10.0000"),
            unidad_de_masa=UnidadDeMasa.L,
            precio_compra=Decimal("6.5000"),
            merma_habitual=Decimal("0.00"),
            created_at=now,
            updated_at=now,
        )
        self._platos: dict[UUID, Plato] = {self.plato.id: self.plato}
        self._ingredientes: dict[UUID, Ingrediente] = {
            self.ing_huevo.id: self.ing_huevo,
            self.ing_aceite.id: self.ing_aceite,
        }
        self._items: dict[UUID, RecetaLinea] = {}

    def _hydrate(self, line: RecetaLinea) -> RecetaLinea:
        plato = self._platos[line.plato_id]
        ing = self._ingredientes[line.ingrediente_id]
        return RecetaLinea(
            id=line.id,
            plato_id=line.plato_id,
            ingrediente_id=line.ingrediente_id,
            cantidad=line.cantidad,
            unidad=line.unidad,
            merma_ingrediente_receta=line.merma_ingrediente_receta,
            created_at=line.created_at,
            updated_at=line.updated_at,
            plato=RecetaPlatoResumen(
                id=plato.id,
                nombre=plato.nombre,
                precio=plato.precio,
                foto=plato.foto,
                stock=plato.stock,
            ),
            ingrediente=RecetaIngredienteResumen(
                id=ing.id,
                nombre=ing.nombre,
                descripcion=ing.descripcion,
                stock=ing.stock,
                unidad_de_masa=ing.unidad_de_masa,
                precio_compra=ing.precio_compra,
                merma_habitual=ing.merma_habitual,
            ),
        )

    @override
    async def get_recetas(
        self,
        plato_id: UUID | None = None,
        ingrediente_id: UUID | None = None,
    ) -> list[RecetaLinea]:
        items = [self._hydrate(item) for item in self._items.values()]
        if plato_id is not None:
            items = [item for item in items if item.plato_id == plato_id]
        if ingrediente_id is not None:
            items = [item for item in items if item.ingrediente_id == ingrediente_id]
        return sorted(items, key=lambda item: item.created_at, reverse=True)

    @override
    async def get_escandallo(self, plato_id: UUID) -> RecetaEscandallo:
        plato = self._platos.get(plato_id)
        if plato is None:
            raise PlatoNoExisteError(plato_id)
        lineas = await self.get_recetas(plato_id=plato_id)
        return RecetaEscandallo(
            plato=plato,
            lineas=lineas,
            version=build_escandallo_version(plato, lineas),
        )

    @override
    async def sync_plato_receta(
        self, plato_id: UUID, payload: RecetaPlatoSyncRequest
    ) -> RecetaEscandallo:
        plato = self._platos.get(plato_id)
        if plato is None:
            raise PlatoNoExisteError(plato_id)
        current_lines = await self.get_recetas(plato_id=plato_id)
        if (
            payload.expected_version is not None
            and build_escandallo_version(plato, current_lines)
            != payload.expected_version
        ):
            raise RecetaConflictError("Conflicto")

        seen_ing: set[UUID] = set()
        current_ids = {line.id for line in current_lines}
        retained: set[UUID] = set()
        for line in payload.lineas:
            if line.ingrediente_id in seen_ing:
                raise IngredienteDuplicadoEnRecetaError(line.ingrediente_id)
            seen_ing.add(line.ingrediente_id)
            if line.id is not None:
                if line.id not in current_ids or line.id in retained:
                    raise RecetaConflictError("Conflicto")
                retained.add(line.id)
            ing = self._ingredientes.get(line.ingrediente_id)
            if ing is None:
                raise IngredienteNoExisteError(line.ingrediente_id)
            if not are_units_compatible(line.unidad, ing.unidad_de_masa):
                raise UnidadIncompatibleError("Unidad incompatible")

        if "precio" in payload.model_fields_set and payload.precio is not None:
            plato = Plato(
                id=plato.id,
                nombre=plato.nombre,
                precio=payload.precio,
                stock=plato.stock,
                foto=plato.foto,
                created_at=plato.created_at,
                updated_at=plato.updated_at + timedelta(seconds=1),
            )
            self._platos[plato_id] = plato

        for line in current_lines:
            if line.id not in retained:
                del self._items[line.id]

        now = datetime.now(UTC)
        for line in payload.lineas:
            if line.id is not None:
                prev = self._items[line.id]
                self._items[line.id] = RecetaLinea(
                    id=prev.id,
                    plato_id=plato_id,
                    ingrediente_id=line.ingrediente_id,
                    cantidad=line.cantidad,
                    unidad=line.unidad,
                    merma_ingrediente_receta=line.merma_ingrediente_receta,
                    created_at=prev.created_at,
                    updated_at=prev.updated_at + timedelta(seconds=1),
                )
            else:
                new_id = uuid4()
                self._items[new_id] = RecetaLinea(
                    id=new_id,
                    plato_id=plato_id,
                    ingrediente_id=line.ingrediente_id,
                    cantidad=line.cantidad,
                    unidad=line.unidad,
                    merma_ingrediente_receta=line.merma_ingrediente_receta,
                    created_at=now,
                    updated_at=now,
                )

        updated_lines = await self.get_recetas(plato_id=plato_id)
        return RecetaEscandallo(
            plato=plato,
            lineas=updated_lines,
            version=build_escandallo_version(plato, updated_lines),
        )


@pytest.fixture
def fake_service() -> FakeRecetaService:
    return FakeRecetaService()


@pytest.fixture
def client(fake_service: FakeRecetaService) -> Iterator[TestClient]:
    app.dependency_overrides[get_receta_service] = lambda: fake_service
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_sync_escandallo_and_list(
    client: TestClient, fake_service: FakeRecetaService
) -> None:
    plato_id = fake_service.plato.id
    huevo_id = fake_service.ing_huevo.id
    aceite_id = fake_service.ing_aceite.id

    initial_res = client.get(f"/recetas/plato/{plato_id}/escandallo")
    assert initial_res.status_code == 200
    initial = RecetaEscandalloResponse.model_validate(initial_res.json())
    assert initial.lineas == []

    sync_res = client.put(
        f"/recetas/plato/{plato_id}",
        json={
            "precio": "9.50",
            "expected_version": initial.version,
            "lineas": [
                {
                    "ingrediente_id": str(huevo_id),
                    "cantidad": "200",
                    "unidad": "G",
                    "merma_ingrediente_receta": "5",
                },
                {
                    "ingrediente_id": str(aceite_id),
                    "cantidad": "25",
                    "unidad": "ML",
                },
            ],
        },
    )
    assert sync_res.status_code == 200
    synced = RecetaEscandalloResponse.model_validate(sync_res.json())
    assert synced.plato.precio == Decimal("9.50")
    assert len(synced.lineas) == 2

    list_res = client.get("/recetas/", params={"plato_id": str(plato_id)})
    assert list_res.status_code == 200
    items = _LIST_RESPONSE_ADAPTER.validate_python(list_res.json())
    assert len(items) == 2

    stale_res = client.put(
        f"/recetas/plato/{plato_id}",
        json={
            "precio": "10.00",
            "expected_version": initial.version,
            "lineas": [],
        },
    )
    assert stale_res.status_code == 409


def test_recetas_domain_errors(
    client: TestClient, fake_service: FakeRecetaService
) -> None:
    plato_id = fake_service.plato.id
    huevo_id = fake_service.ing_huevo.id

    incompatible = client.put(
        f"/recetas/plato/{plato_id}",
        json={
            "lineas": [
                {"ingrediente_id": str(huevo_id), "cantidad": "100", "unidad": "ML"}
            ]
        },
    )
    assert incompatible.status_code == 422

    duplicated = client.put(
        f"/recetas/plato/{plato_id}",
        json={
            "lineas": [
                {"ingrediente_id": str(huevo_id), "cantidad": "100", "unidad": "G"},
                {"ingrediente_id": str(huevo_id), "cantidad": "50", "unidad": "G"},
            ]
        },
    )
    assert duplicated.status_code == 409

    missing_plato = client.get(f"/recetas/plato/{uuid4()}/escandallo")
    assert missing_plato.status_code == 404
