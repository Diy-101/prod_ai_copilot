from __future__ import annotations

from app.models import Action, HttpMethod
from app.services.execution_service import ExecutionService


def test_topological_sort_linear_graph():
    ordered = ExecutionService._topological_sort(
        steps=[1, 2, 3],
        edges=[
            {"from_step": 1, "to_step": 2, "type": "users"},
            {"from_step": 2, "to_step": 3, "type": "segments"},
        ],
    )
    assert ordered == [1, 2, 3]


def test_extract_value_from_output_by_edge_type():
    output = {"users": [{"id": 1}]}
    value = ExecutionService._extract_value_from_output(output, "users")
    assert value == [{"id": 1}]


def test_build_request_payload_uses_path_params_and_defaults():
    action = Action(
        method=HttpMethod.GET,
        path="/users/{user_id}",
        base_url="https://api.example.com",
        parameters_schema={
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "string",
                    "x-parameter-location": "path",
                },
                "limit": {
                    "type": "integer",
                    "x-parameter-location": "query",
                    "default": 10,
                },
            },
            "required": ["user_id"],
        },
    )

    service = ExecutionService(session=None)  # type: ignore[arg-type]
    payload = service._build_request_payload(
        action=action,
        resolved_inputs={"user_id": "abc"},
    )

    assert payload["url"] == "https://api.example.com/users/abc"
    assert payload["query_params"] == {"limit": 10}
    assert payload["missing_required"] == []
