from __future__ import annotations

from uuid import uuid4

import pytest


@pytest.mark.asyncio
async def test_generate_pipeline_ready(async_client, monkeypatch):
    from app.api.pipelines import generate as generate_module

    pipeline_id = uuid4()
    capability_id = uuid4()
    action_id = uuid4()

    async def _fake_generate(self, dialog_id, message, user_id=None, capability_ids=None):
        return {
            "status": "ready",
            "message_ru": "Пайплайн успешно собран.",
            "chat_reply_ru": "Пайплайн готов.",
            "pipeline_id": pipeline_id,
            "nodes": [
                {
                    "step": 1,
                    "name": "get_users",
                    "description": "Get users",
                    "input_connected_from": [],
                    "output_connected_to": [],
                    "input_data_type_from_previous": [],
                    "external_inputs": [],
                    "endpoints": [
                        {
                            "name": "get_users",
                            "capability_id": capability_id,
                            "action_id": action_id,
                            "input_type": None,
                            "output_type": "users[]",
                        }
                    ],
                }
            ],
            "edges": [],
            "missing_requirements": [],
            "context_summary": "summary",
        }

    monkeypatch.setattr(generate_module.PipelineGenerationService, "generate", _fake_generate)

    response = await async_client.post(
        "/api/v1/pipelines/generate",
        json={
            "dialog_id": str(uuid4()),
            "message": "Собери пайплайн",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ready"
    assert payload["message_ru"] == "Пайплайн успешно собран."
    assert payload["chat_reply_ru"] == "Пайплайн готов."
    assert payload["pipeline_id"] == str(pipeline_id)
    assert len(payload["nodes"]) == 1
    assert "edges" in payload


@pytest.mark.asyncio
async def test_generate_pipeline_ollama_fallback(async_client, monkeypatch):
    from app.api.pipelines import generate as generate_module

    async def _raise_ollama_error(self, dialog_id, message, user_id=None, capability_ids=None):
        raise RuntimeError("ollama timeout")

    monkeypatch.setattr(generate_module.PipelineGenerationService, "generate", _raise_ollama_error)

    response = await async_client.post(
        "/api/v1/pipelines/generate",
        json={
            "dialog_id": str(uuid4()),
            "message": "Собери пайплайн",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "cannot_build"
    assert "ollama_unavailable" in payload["missing_requirements"]
    assert payload["nodes"] == []
    assert payload["edges"] == []


@pytest.mark.asyncio
async def test_reset_pipeline_dialog(async_client, monkeypatch):
    from app.api.pipelines import reset_dialog as reset_dialog_module

    async def _fake_reset_dialog(self, dialog_id):
        return {"status": "ok", "message_ru": "Контекст диалога сброшен."}

    monkeypatch.setattr(reset_dialog_module.PipelineGenerationService, "reset_dialog", _fake_reset_dialog)

    response = await async_client.post(
        "/api/v1/pipelines/dialog/reset",
        json={"dialog_id": str(uuid4())},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["message_ru"] == "Контекст диалога сброшен."

