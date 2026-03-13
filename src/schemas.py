from typing import Any

from pydantic import BaseModel, Field


class PingResponse(BaseModel):
    status: str
    service: str
    version: str


class OpenAPIIngestRequest(BaseModel):
    source_name: str
    openapi_spec: dict[str, Any]


class OpenAPIIngestResponse(BaseModel):
    status: str
    source_name: str
    message: str
    artifacts: dict[str, bool]


class PlanRequest(BaseModel):
    task: str
    top_k: int = Field(default=5, ge=1)


class PipelineResponse(BaseModel):
    id: str
    title: str
    steps: list[str]


class PlanResponse(BaseModel):
    status: str
    task: str
    candidate_pipelines: list[PipelineResponse]
    best_pipeline_id: str
