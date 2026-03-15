from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database.session import get_session
from app.models import ExecutionRun, ExecutionStepRun
from app.schemas.execution_sch import ExecutionRunDetailResponse, ExecutionStepRunResponse


router = APIRouter(tags=["Executions"])


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
            ExecutionStepRunResponse.model_validate(step_run, from_attributes=True)
            for step_run in step_runs
        ],
    )
