from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database.session import get_session
from app.models import ExecutionRun
from app.schemas.execution_sch import ExecutionRunListItemResponse


router = APIRouter(tags=["Executions"])


@router.get("/", response_model=list[ExecutionRunListItemResponse])
async def list_executions(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    session: AsyncSession = Depends(get_session),
):
    query = (
        select(ExecutionRun)
        .order_by(ExecutionRun.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await session.execute(query)
    return list(result.scalars().all())
