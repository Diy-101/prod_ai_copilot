from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database.session import get_session
from app.schemas.pipeline_sch import (
    PipelineGenerateRequest,
    PipelineGenerateResponse,
)
from app.services.pipeline_generation import PipelineGenerationService


router = APIRouter(tags=["Pipelines"])


@router.post("/generate", response_model=PipelineGenerateResponse, status_code=status.HTTP_200_OK)
async def generate_pipeline_graph(
    request_data: PipelineGenerateRequest,
    session: AsyncSession = Depends(get_session),
):
    user_query = request_data.user_query.strip()
    if not user_query:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="user_query must not be empty",
        )

    # Используем единственную точку входа для генерации
    generation_service = PipelineGenerationService(session)
    
    # Если диалог не передан, создаем временный UUID 
    # (в реальности фронт должен присылать стабильный ID чата)
    import uuid
    dialog_id = request_data.dialog_id or uuid.uuid4()

    result = await generation_service.generate(
        dialog_id=dialog_id,
        message=user_query,
    )

    return PipelineGenerateResponse(**result)
