from __future__ import annotations

from types import SimpleNamespace
from uuid import uuid4

from app.services.capability_service import CapabilityService


def test_build_capability_payload_stores_rich_action_context():
    action = SimpleNamespace(
        id=uuid4(),
        operation_id="sendCampaignEmail",
        method=SimpleNamespace(value="POST"),
        path="/v1/campaigns/{campaign_id}/emails/send",
        base_url="https://api.example.com",
        summary="Send campaign email",
        description="Send email for selected users",
        tags=["campaign", "email"],
        source_filename="crm.yaml",
        parameters_schema={
            "type": "object",
            "required": ["campaign_id"],
            "properties": {
                "campaign_id": {"type": "string", "x-parameter-location": "path"},
                "segment_id": {"type": "string", "x-parameter-location": "query"},
            },
        },
        request_body_schema={
            "type": "object",
            "required": ["subject", "template_id"],
            "properties": {
                "subject": {"type": "string"},
                "template_id": {"type": "string"},
            },
            "x-content-type": "application/json",
        },
        response_schema={
            "type": "object",
            "properties": {"delivery_id": {"type": "string"}},
            "x-content-type": "application/json",
        },
        raw_spec={
            "deprecated": False,
            "security": [{"BearerAuth": []}],
            "requestBody": {
                "content": {
                    "application/json": {
                        "schema": {"type": "object"},
                    }
                }
            },
            "responses": {
                "200": {
                    "content": {
                        "application/json": {
                            "schema": {"type": "object"},
                        }
                    }
                }
            },
        },
    )

    payload = CapabilityService._build_capability_payload(action)
    llm_payload = payload["llm_payload"]
    action_context = llm_payload["action_context"]
    hints = llm_payload["openapi_hints"]

    assert payload["name"] == "sendCampaignEmail"
    assert payload["description"] == "Send campaign email"
    assert action_context["method"] == "POST"
    assert action_context["path"] == "/v1/campaigns/{campaign_id}/emails/send"
    assert action_context["raw_spec"]["responses"]["200"] is not None
    assert action_context["input_signals"]["required_inputs"] == ["campaign_id", "subject", "template_id"]
    assert hints["request_content_types"] == ["application/json"]
    assert "200" in hints["response_status_codes"]

