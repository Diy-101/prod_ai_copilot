from __future__ import annotations

from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class PipelineGenerateRequest(BaseModel):
    user_query: str = Field(..., min_length=1)
    dialog_id: UUID | None = None


class PipelineGenerateResponse(BaseModel):
    status: str
    message_ru: str
    chat_reply_ru: str
    pipeline_id: UUID | None = None
    nodes: list[dict[str, Any]] = Field(default_factory=list)
    edges: list[dict[str, Any]] = Field(default_factory=list)
    context_summary: str | None = None
