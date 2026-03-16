from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database.session import get_session
from app.models import ExecutionRun, ExecutionStepRun
from app.schemas.execution_sch import ExecutionRunDetailResponse, ExecutionStepRunResponse


router = APIRouter(tags=["Executions"])
KNOWN_HTTP_METHODS = {"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"}
REQUEST_BODY_METHODS = {"POST", "PUT", "PATCH"}


def _extract_method(request_snapshot: dict[str, Any] | None) -> str | None:
    if not isinstance(request_snapshot, dict):
        return None

    method_raw = request_snapshot.get("method")
    if not isinstance(method_raw, str):
        return None

    method = method_raw.upper()
    if method in KNOWN_HTTP_METHODS:
        return method
    return None


def _extract_status_code(response_snapshot: dict[str, Any] | None) -> int | None:
    if not isinstance(response_snapshot, dict):
        return None

    status_code_raw = response_snapshot.get("status_code")
    if isinstance(status_code_raw, int):
        return status_code_raw
    if isinstance(status_code_raw, str) and status_code_raw.isdigit():
        return int(status_code_raw)
    return None


def _extract_accepted_payload(
    *,
    method: str | None,
    request_snapshot: dict[str, Any] | None,
) -> Any:
    if method not in REQUEST_BODY_METHODS:
        return None
    if not isinstance(request_snapshot, dict):
        return None
    return request_snapshot.get("json_body")


def _extract_output_payload(response_snapshot: dict[str, Any] | None) -> Any:
    if not isinstance(response_snapshot, dict):
        return None
    return response_snapshot.get("body")


def _build_step_run_response(step_run: ExecutionStepRun) -> ExecutionStepRunResponse:
    base = ExecutionStepRunResponse.model_validate(step_run, from_attributes=True)
    request_snapshot = base.request_snapshot if isinstance(base.request_snapshot, dict) else None
    response_snapshot = base.response_snapshot if isinstance(base.response_snapshot, dict) else None
    method = _extract_method(request_snapshot)
    status_code = _extract_status_code(response_snapshot)
    accepted_payload = _extract_accepted_payload(method=method, request_snapshot=request_snapshot)
    output_payload = _extract_output_payload(response_snapshot)
    return base.model_copy(
        update={
            "method": method,
            "status_code": status_code,
            "accepted_payload": accepted_payload,
            "output_payload": output_payload,
        }
    )


@router.get("/{run_id}", response_model=ExecutionRunDetailResponse)
async def get_execution(
    run_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    run = await session.get(ExecutionRun, run_id)
    if run is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Execution run not found")

    step_query = (
        select(ExecutionStepRun)
        .where(ExecutionStepRun.run_id == run.id)
        .order_by(ExecutionStepRun.step.asc(), ExecutionStepRun.created_at.asc())
    )
    step_result = await session.execute(step_query)
    step_runs = list(step_result.scalars().all())

    return ExecutionRunDetailResponse(
        id=run.id,
        pipeline_id=run.pipeline_id,
        status=run.status.value,
        inputs=run.inputs or {},
        summary=run.summary,
        error=run.error,
        started_at=run.started_at,
        finished_at=run.finished_at,
        created_at=run.created_at,
        updated_at=run.updated_at,
        steps=[
            _build_step_run_response(step_run)
            for step_run in step_runs
        ],
    )
