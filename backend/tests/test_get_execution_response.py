from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from app.api.executions.get_execution import _build_step_run_response
from app.models.execution import ExecutionStepRun, ExecutionStepStatus


def _build_step_run(
    *,
    request_snapshot,
    response_snapshot,
) -> ExecutionStepRun:
    now = datetime.now(timezone.utc)
    step_run = ExecutionStepRun(
        run_id=uuid4(),
        step=1,
        status=ExecutionStepStatus.SUCCEEDED,
    )
    step_run.name = "Step 1"
    step_run.request_snapshot = request_snapshot
    step_run.response_snapshot = response_snapshot
    step_run.created_at = now
    step_run.updated_at = now
    return step_run


def test_build_step_run_response_for_post_sets_accepted_and_output_payloads():
    step_run = _build_step_run(
        request_snapshot={
            "method": "post",
            "json_body": {"subject": "Hi", "message": "Hello"},
        },
        response_snapshot={
            "status_code": 200,
            "body": {"sent": 1},
        },
    )

    response = _build_step_run_response(step_run)

    assert response.method == "POST"
    assert response.status_code == 200
    assert response.accepted_payload == {"subject": "Hi", "message": "Hello"}
    assert response.output_payload == {"sent": 1}


def test_build_step_run_response_for_get_keeps_accepted_payload_none():
    step_run = _build_step_run(
        request_snapshot={
            "method": "GET",
            "query_params": {"limit": 20},
        },
        response_snapshot={
            "status_code": "204",
            "body": "",
        },
    )

    response = _build_step_run_response(step_run)

    assert response.method == "GET"
    assert response.status_code == 204
    assert response.accepted_payload is None
    assert response.output_payload == ""


def test_build_step_run_response_handles_missing_snapshots():
    step_run = _build_step_run(
        request_snapshot=None,
        response_snapshot=None,
    )

    response = _build_step_run_response(step_run)

    assert response.method is None
    assert response.status_code is None
    assert response.accepted_payload is None
    assert response.output_payload is None
