from __future__ import annotations

from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class PipelineGenerateRequest(BaseModel):
    user_query: str = Field(..., min_length=1)


class CapabilityUsedResponse(BaseModel):
    id: UUID
    name: str
    score: float


class PipelineGenerateMetaResponse(BaseModel):
    model: str
    prompt_version: str
    semantic_source: str


class PipelineGenerateResponse(BaseModel):
    raw_graph: dict[str, Any]
    capabilities_used: list[CapabilityUsedResponse]
    meta: PipelineGenerateMetaResponse
