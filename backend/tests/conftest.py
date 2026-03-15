from __future__ import annotations

import sys
import types
import uuid
from dataclasses import dataclass
from typing import Any

import pytest
from httpx import ASGITransport, AsyncClient


def _install_semantic_selection_stub() -> None:
    """
    Some branches may miss app.services.semantic_selection.
    Install a minimal stub so app import is stable for API tests.
    """
    module_name = "app.services.semantic_selection"
    if module_name in sys.modules:
        return

    stub_module = types.ModuleType(module_name)

    @dataclass
    class SelectedCapability:
        capability: Any
        score: float = 1.0

    class SemanticSelectionService:
        async def select_capabilities(self, *args: Any, **kwargs: Any) -> list[SelectedCapability]:
            return []

    stub_module.SelectedCapability = SelectedCapability
    stub_module.SemanticSelectionService = SemanticSelectionService
    sys.modules[module_name] = stub_module


_install_semantic_selection_stub()

from app.core.database.session import get_session
from app.main import app


class DummyAsyncSession:
    def __init__(self) -> None:
        self.added: list[Any] = []
        self.added_many: list[Any] = []
        self.flushed = False
        self.committed = False
        self.refreshed: list[Any] = []

    def add(self, obj: Any) -> None:
        self.added.append(obj)

    def add_all(self, objs: list[Any]) -> None:
        self.added_many.extend(objs)

    async def flush(self) -> None:
        self.flushed = True

    async def commit(self) -> None:
        self.committed = True

    async def refresh(self, obj: Any) -> None:
        self.refreshed.append(obj)

    async def execute(self, *args: Any, **kwargs: Any) -> Any:
        return None

    async def get(self, *args: Any, **kwargs: Any) -> Any:
        return None


@pytest.fixture
def stable_uuid() -> uuid.UUID:
    return uuid.UUID("11111111-1111-1111-1111-111111111111")


@pytest.fixture
def dummy_session() -> DummyAsyncSession:
    return DummyAsyncSession()


@pytest.fixture
async def async_client(dummy_session: DummyAsyncSession):
    async def _override_get_session():
        yield dummy_session

    app.dependency_overrides[get_session] = _override_get_session
    transport = ASGITransport(app=app, lifespan="off")
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()

