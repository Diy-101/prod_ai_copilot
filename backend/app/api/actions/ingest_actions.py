from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database.session import get_session
from app.schemas.capability_sch import ActionIngestWithCapabilitiesResponse
from app.services.capability_ingestion import ingest_openapi_to_capabilities


router = APIRouter(tags=["Actions"])


@router.post("/ingest", response_model=ActionIngestWithCapabilitiesResponse, status_code=status.HTTP_201_CREATED)
async def ingest_actions(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
):
    try:
        actions, capabilities = await ingest_openapi_to_capabilities(file, session)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return ActionIngestWithCapabilitiesResponse(
        created_actions_count=len(actions),
        created_capabilities_count=len(capabilities),
        capabilities=capabilities,
    )
