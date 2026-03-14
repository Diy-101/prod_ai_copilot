from fastapi import APIRouter

from src.schemas import (
    ComposePlanRequest,
    ComposePlanResponse,
    OpenAPIIngestRequest,
    OpenAPIIngestResponse,
    PingResponse,
    PlanRequest,
    PlanResponse,
)
from src.services.compress import compress_openapi
from src.services.ingest import ingest_openapi
from src.services.plan import generate_compose_plan, generate_plan
from src.services.registry import build_registry

router = APIRouter()


@router.get("/ping", response_model=PingResponse)
async def ping():
    return {
        "status": "ok",
        "service": "ml-planner",
        "version": "0.1.0",
    }


@router.post("/ingest/openapi", response_model=OpenAPIIngestResponse)
async def ingest_openapi_endpoint(payload: OpenAPIIngestRequest):
    parsed_spec = ingest_openapi(payload.source_name, payload.openapi_spec)
    compressed_spec = compress_openapi(payload.source_name, payload.openapi_spec)
    registry = build_registry(payload.source_name, compressed_spec)

    return {
        "status": "accepted",
        "source_name": payload.source_name,
        "message": "OpenAPI spec ingested successfully",
        "artifacts": {
            "parsed": bool(parsed_spec.get("parsed")),
            "compressed": bool(compressed_spec.get("compressed")),
            "registry_built": bool(registry.get("registry_built")),
        },
    }


@router.post("/plan", response_model=PlanResponse)
async def plan_endpoint(payload: PlanRequest):
    return generate_plan(task=payload.task, top_k=payload.top_k)


@router.post("/plan/compose", response_model=ComposePlanResponse)
async def compose_plan_endpoint(payload: ComposePlanRequest):
    return generate_compose_plan(
        task=payload.task,
        source_names=payload.source_names,
        top_k=payload.top_k,
        max_steps=payload.max_steps,
    )
