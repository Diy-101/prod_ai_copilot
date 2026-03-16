from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database.session import get_session
from app.models import ExecutionRun, ExecutionStepRun, Pipeline, User, UserRole
from app.schemas.execution_sch import ExecutionRunDetailResponse, ExecutionStepRunResponse
from app.utils.token_manager import get_current_user


router = APIRouter(tags=["Executions"])


@router.get("/{run_id}", response_model=ExecutionRunDetailResponse)
async def get_execution(
    run_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    run = await session.get(ExecutionRun, run_id)
    if run is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Execution run not found")

    if current_user.role != UserRole.ADMIN:
        is_owner = run.initiated_by == current_user.id
        if not is_owner and run.initiated_by is None:
            pipeline = await session.get(Pipeline, run.pipeline_id)
            is_owner = pipeline is not None and pipeline.created_by == current_user.id
        if not is_owner:
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
