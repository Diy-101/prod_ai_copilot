from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database.session import get_session
from app.schemas.pipeline_sch import (
    CapabilityUsedResponse,
    PipelineGenerateMetaResponse,
    PipelineGenerateRequest,
    PipelineGenerateResponse,
)
from app.services.pipeline_generation import PipelineGenerationError, PipelineGenerationService
from app.services.pipeline_prompt_builder import PROMPT_VERSION
from app.services.semantic_selection import SemanticSelectionService


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

    semantic_service = SemanticSelectionService()
    selected_capabilities = await semantic_service.select_capabilities(session, user_query=user_query, limit=5)
    if not selected_capabilities:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No relevant capabilities found for the provided query",
        )

    generation_service = PipelineGenerationService()
    try:
        raw_graph = generation_service.generate_raw_graph(
            user_query=user_query,
            selected_capabilities=selected_capabilities,
        )
    except PipelineGenerationError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    capabilities_used = [
        CapabilityUsedResponse(
            id=item.capability.id,
            name=item.capability.name,
            score=item.score,
        )
        for item in selected_capabilities
    ]

    return PipelineGenerateResponse(
        raw_graph=raw_graph,
        capabilities_used=capabilities_used,
        meta=PipelineGenerateMetaResponse(
            model=generation_service.model,
            prompt_version=PROMPT_VERSION,
            semantic_source="semantic_selection_service",
        ),
    )
