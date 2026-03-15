from __future__ import annotations

from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException

from app.models import ActionIngestStatus, HttpMethod


def _action_payload(*, operation_id: str, method: HttpMethod, path: str, status: ActionIngestStatus) -> dict:
    return {
        "operation_id": operation_id,
        "method": method,
        "path": path,
        "source_filename": "sample.yaml",
        "summary": operation_id,
        "ingest_status": status,
        "ingest_error": None if status == ActionIngestStatus.SUCCEEDED else "parse_error",
        "is_deleted": False,
    }


@pytest.mark.asyncio
async def test_ingest_actions_success(async_client, dummy_session, monkeypatch):
    from app.api.actions import ingest_actions as ingest_module

    monkeypatch.setattr(ingest_module.OpenAPIService, "load_document", staticmethod(lambda payload: {"ok": True}))
    monkeypatch.setattr(
        ingest_module.OpenAPIService,
        "extract_actions_with_failures",
        staticmethod(
            lambda document, source_filename: {
                "succeeded": [
                    _action_payload(
                        operation_id="getUsers",
                        method=HttpMethod.GET,
                        path="/users",
                        status=ActionIngestStatus.SUCCEEDED,
                    )
                ],
                "failed": [
                    _action_payload(
                        operation_id="brokenAction",
                        method=HttpMethod.POST,
                        path="/broken",
                        status=ActionIngestStatus.FAILED,
                    )
                ],
            }
        ),
    )

    async def _fake_create_from_actions(self, actions, refresh=False):
        assert len(actions) == 1
        return [
            SimpleNamespace(
                id=uuid4(),
                action_id=actions[0].id,
                name="getUsersCapability",
                description="cap",
            )
        ]

    monkeypatch.setattr(ingest_module.CapabilityService, "create_from_actions", _fake_create_from_actions)

    response = await async_client.post(
        "/api/v1/actions/ingest",
        files={"file": ("sample.yaml", "openapi: 3.0.0", "application/yaml")},
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["succeeded_count"] == 1
    assert payload["failed_count"] == 1
    assert payload["created_capabilities_count"] == 1
    assert len(payload["succeeded_actions"]) == 1
    assert len(payload["failed_actions"]) == 1
    assert len(payload["capabilities"]) == 1
    assert dummy_session.flushed is True
    assert dummy_session.committed is True


@pytest.mark.asyncio
async def test_ingest_actions_invalid_openapi(async_client, monkeypatch):
    from app.api.actions import ingest_actions as ingest_module

    def _raise_value_error(payload):
        raise ValueError("invalid openapi")

    monkeypatch.setattr(ingest_module.OpenAPIService, "load_document", staticmethod(_raise_value_error))

    response = await async_client.post(
        "/api/v1/actions/ingest",
        files={"file": ("broken.yaml", "not-openapi", "application/yaml")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "invalid openapi"


@pytest.mark.asyncio
async def test_get_action_success(async_client, monkeypatch):
    from app.api.actions import get_action as get_action_module

    action_id = uuid4()
    now = datetime.now(timezone.utc)
    action = SimpleNamespace(
        id=action_id,
        operation_id="getUsers",
        method=HttpMethod.GET,
        path="/users",
        base_url=None,
        summary="Get users",
        description="desc",
        tags=["users"],
        source_filename="sample.yaml",
        ingest_status=ActionIngestStatus.SUCCEEDED,
        ingest_error=None,
        created_at=now,
        updated_at=now,
        parameters_schema=None,
        request_body_schema=None,
        response_schema={"type": "array"},
        raw_spec={"x": 1},
    )

    async def _fake_get_action_or_404(session, action_id_param: UUID):
        assert action_id_param == action_id
        return action

    monkeypatch.setattr(get_action_module, "get_active_action_or_404", _fake_get_action_or_404)

    response = await async_client.get(f"/api/v1/actions/{action_id}")
    assert response.status_code == 200
    payload = response.json()
    assert payload["id"] == str(action_id)
    assert payload["operation_id"] == "getUsers"
    assert payload["method"] == "GET"
    assert payload["json_schema"]["response"]["type"] == "array"


@pytest.mark.asyncio
async def test_get_action_not_found(async_client, monkeypatch):
    from app.api.actions import get_action as get_action_module

    async def _fake_get_action_or_404(session, action_id_param: UUID):
        raise HTTPException(status_code=404, detail="Action not found")

    monkeypatch.setattr(get_action_module, "get_active_action_or_404", _fake_get_action_or_404)

    response = await async_client.get(f"/api/v1/actions/{uuid4()}")
    assert response.status_code == 404
    assert response.json()["message"] == "Action not found"


@pytest.mark.asyncio
async def test_delete_action_marks_deleted(async_client, dummy_session, monkeypatch):
    from app.api.actions import delete_action as delete_action_module

    action = SimpleNamespace(is_deleted=False)

    async def _fake_get_action_or_404(session, action_id_param: UUID):
        return action

    monkeypatch.setattr(delete_action_module, "get_active_action_or_404", _fake_get_action_or_404)

    response = await async_client.delete(f"/api/v1/actions/{uuid4()}")
    assert response.status_code == 204
    assert action.is_deleted is True
    assert dummy_session.committed is True

