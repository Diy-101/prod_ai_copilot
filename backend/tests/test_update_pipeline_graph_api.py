from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

import pytest
from httpx import ASGITransport, AsyncClient, Response

from app.core.database.session import get_session
from app.main import app
from app.models import Pipeline, PipelineStatus, User, UserRole
from app.utils.token_manager import get_current_user


class FakeSession:
    def __init__(self, pipeline: Pipeline | None):
        self.pipeline = pipeline
        self.committed = False

    async def get(self, model, key: UUID):
        if model is Pipeline and self.pipeline and key == self.pipeline.id:
            return self.pipeline
        return None

    async def commit(self):
        self.committed = True
        if self.pipeline is not None:
            self.pipeline.updated_at = datetime.now(timezone.utc)

    async def refresh(self, _obj):
        return None


@pytest.fixture(autouse=True)
def clear_dependency_overrides():
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()


def _build_user(*, user_id: UUID, role: UserRole = UserRole.USER) -> User:
    user = User(
        id=user_id,
        email=f"{user_id}@example.com",
        hashed_password="hashed",
        role=role,
        is_active=True,
    )
    user.created_at = datetime.now(timezone.utc)
    user.updated_at = datetime.now(timezone.utc)
    return user


def _build_pipeline(*, pipeline_id: UUID, owner_id: UUID) -> Pipeline:
    pipeline = Pipeline(
        id=pipeline_id,
        name="Travel pipeline",
        description=None,
        user_prompt=None,
        nodes=[
            {
                "step": 1,
                "name": "Get users",
                "description": None,
                "input_connected_from": [99],
                "output_connected_to": [98],
                "input_data_type_from_previous": [],
                "external_inputs": [],
                "endpoints": [],
            },
            {
                "step": 2,
                "name": "Segment users",
                "description": None,
                "input_connected_from": [],
                "output_connected_to": [],
                "input_data_type_from_previous": [],
                "external_inputs": [],
                "endpoints": [],
            },
        ],
        edges=[],
        status=PipelineStatus.DRAFT,
        created_by=owner_id,
    )
    pipeline.created_at = datetime.now(timezone.utc)
    pipeline.updated_at = datetime.now(timezone.utc)
    return pipeline


async def _patch_graph(pipeline_id: UUID, payload: dict) -> Response:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        return await client.patch(f"/api/v1/pipelines/{pipeline_id}/graph", json=payload)


@pytest.mark.asyncio
async def test_patch_graph_success_for_owner_normalizes_connections():
    owner_id = uuid4()
    pipeline_id = uuid4()
    fake_session = FakeSession(_build_pipeline(pipeline_id=pipeline_id, owner_id=owner_id))

    async def override_session():
        yield fake_session

    async def override_user():
        return _build_user(user_id=owner_id)

    app.dependency_overrides[get_session] = override_session
    app.dependency_overrides[get_current_user] = override_user

    response = await _patch_graph(
        pipeline_id,
        {
            "nodes": fake_session.pipeline.nodes,
            "edges": [{"from_step": 1, "to_step": 2, "type": "users"}],
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["pipeline_id"] == str(pipeline_id)
    assert payload["edges"] == [{"from_step": 1, "to_step": 2, "type": "users"}]
    assert payload["nodes"][0]["output_connected_to"] == [2]
    assert payload["nodes"][1]["input_connected_from"] == [1]
    assert payload["nodes"][1]["input_data_type_from_previous"] == [
        {"from_step": 1, "type": "users"}
    ]
    assert isinstance(payload["updated_at"], str)
    assert fake_session.committed is True


@pytest.mark.asyncio
async def test_patch_graph_returns_404_for_non_owner():
    owner_id = uuid4()
    pipeline_id = uuid4()
    fake_session = FakeSession(_build_pipeline(pipeline_id=pipeline_id, owner_id=owner_id))

    async def override_session():
        yield fake_session

    async def override_user():
        return _build_user(user_id=uuid4())

    app.dependency_overrides[get_session] = override_session
    app.dependency_overrides[get_current_user] = override_user

    response = await _patch_graph(
        pipeline_id,
        {
            "nodes": fake_session.pipeline.nodes,
            "edges": [{"from_step": 1, "to_step": 2, "type": "users"}],
        },
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_patch_graph_rejects_cycle():
    owner_id = uuid4()
    pipeline_id = uuid4()
    fake_session = FakeSession(_build_pipeline(pipeline_id=pipeline_id, owner_id=owner_id))

    async def override_session():
        yield fake_session

    async def override_user():
        return _build_user(user_id=owner_id)

    app.dependency_overrides[get_session] = override_session
    app.dependency_overrides[get_current_user] = override_user

    response = await _patch_graph(
        pipeline_id,
        {
            "nodes": fake_session.pipeline.nodes,
            "edges": [
                {"from_step": 1, "to_step": 2, "type": "users"},
                {"from_step": 2, "to_step": 1, "type": "segments"},
            ],
        },
    )

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert "graph: cycle" in detail["errors"]


@pytest.mark.asyncio
async def test_patch_graph_rejects_edge_to_missing_node():
    owner_id = uuid4()
    pipeline_id = uuid4()
    fake_session = FakeSession(_build_pipeline(pipeline_id=pipeline_id, owner_id=owner_id))

    async def override_session():
        yield fake_session

    async def override_user():
        return _build_user(user_id=owner_id)

    app.dependency_overrides[get_session] = override_session
    app.dependency_overrides[get_current_user] = override_user

    response = await _patch_graph(
        pipeline_id,
        {
            "nodes": fake_session.pipeline.nodes,
            "edges": [{"from_step": 1, "to_step": 999, "type": "users"}],
        },
    )

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert "graph: edge_to_missing_node:1->999" in detail["errors"]


@pytest.mark.asyncio
async def test_patch_graph_rejects_duplicate_edge_triplets():
    owner_id = uuid4()
    pipeline_id = uuid4()
    fake_session = FakeSession(_build_pipeline(pipeline_id=pipeline_id, owner_id=owner_id))

    async def override_session():
        yield fake_session

    async def override_user():
        return _build_user(user_id=owner_id)

    app.dependency_overrides[get_session] = override_session
    app.dependency_overrides[get_current_user] = override_user

    response = await _patch_graph(
        pipeline_id,
        {
            "nodes": fake_session.pipeline.nodes,
            "edges": [
                {"from_step": 1, "to_step": 2, "type": "users"},
                {"from_step": 1, "to_step": 2, "type": "users"},
            ],
        },
    )

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert "graph: duplicate_edge:1->2:users" in detail["errors"]
