import uuid

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.database.session import get_session
from app.main import app
from app.models import Capability
from app.services.pipeline_generation import PipelineGenerationError
from app.services.semantic_selection import SelectedCapability


class DummySession:
    pass


@pytest.mark.asyncio
async def test_generate_pipeline_graph_success(monkeypatch):
    capability = Capability(
        id=uuid.uuid4(),
        action_id=uuid.uuid4(),
        name="find_recent_orders",
        description="Find recent paid orders",
        input_schema={"type": "object", "properties": {"limit": {"type": "integer"}}},
        output_schema={"type": "object", "properties": {"orders": {"type": "array"}}},
        data_format={"request_content_types": ["application/json"]},
    )

    async def fake_select_capabilities(self, session, user_query, limit=5):
        return [SelectedCapability(capability=capability, score=4.5)]

    def fake_generate_raw_graph(self, user_query, selected_capabilities):
        return {
            "nodes": [{"id": "n1", "capability_id": str(capability.id)}],
            "edges": [],
            "variable_injections": [],
        }

    async def override_session():
        yield DummySession()

    monkeypatch.setattr(
        "app.services.semantic_selection.SemanticSelectionService.select_capabilities",
        fake_select_capabilities,
    )
    monkeypatch.setattr(
        "app.services.pipeline_generation.PipelineGenerationService.generate_raw_graph",
        fake_generate_raw_graph,
    )
    app.dependency_overrides[get_session] = override_session
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.post("/api/v1/pipelines/generate", json={"user_query": "find paid orders"})
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert "raw_graph" in payload
    assert "nodes" in payload["raw_graph"]
    assert "edges" in payload["raw_graph"]
    assert payload["capabilities_used"][0]["id"] == str(capability.id)


@pytest.mark.asyncio
async def test_generate_pipeline_graph_returns_404_when_no_capabilities(monkeypatch):
    async def fake_select_capabilities(self, session, user_query, limit=5):
        return []

    async def override_session():
        yield DummySession()

    monkeypatch.setattr(
        "app.services.semantic_selection.SemanticSelectionService.select_capabilities",
        fake_select_capabilities,
    )
    app.dependency_overrides[get_session] = override_session
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.post("/api/v1/pipelines/generate", json={"user_query": "unknown domain query"})
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_generate_pipeline_graph_returns_502_on_llm_error(monkeypatch):
    capability = Capability(
        id=uuid.uuid4(),
        action_id=uuid.uuid4(),
        name="send_notification",
        description="Send message",
    )

    async def fake_select_capabilities(self, session, user_query, limit=5):
        return [SelectedCapability(capability=capability, score=2.0)]

    def fake_generate_raw_graph(self, user_query, selected_capabilities):
        raise PipelineGenerationError("Failed to call Ollama")

    async def override_session():
        yield DummySession()

    monkeypatch.setattr(
        "app.services.semantic_selection.SemanticSelectionService.select_capabilities",
        fake_select_capabilities,
    )
    monkeypatch.setattr(
        "app.services.pipeline_generation.PipelineGenerationService.generate_raw_graph",
        fake_generate_raw_graph,
    )
    app.dependency_overrides[get_session] = override_session
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.post("/api/v1/pipelines/generate", json={"user_query": "send alert"})
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 502


@pytest.mark.asyncio
async def test_generate_pipeline_graph_returns_422_on_blank_query():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/pipelines/generate", json={"user_query": "   "})
    assert response.status_code == 422
