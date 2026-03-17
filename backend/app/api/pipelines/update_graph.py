from __future__ import annotations

from collections import defaultdict
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database.session import get_session
from app.models import Pipeline, User, UserRole
from app.schemas.pipeline_chat_sch import (
    PipelineGraphUpdateRequest,
    PipelineGraphUpdateResponse,
)
from app.utils.business_logger import log_business_event
from app.utils.token_manager import get_current_user


router = APIRouter(tags=["Pipelines"])


def _graph_has_cycle(steps: set[int], edges: list[dict[str, int | str]]) -> bool:
    adjacency: dict[int, set[int]] = {step: set() for step in steps}
    for edge in edges:
        src = edge["from_step"]
        dst = edge["to_step"]
        if isinstance(src, int) and isinstance(dst, int):
            adjacency.setdefault(src, set()).add(dst)

    visiting: set[int] = set()
    visited: set[int] = set()

    def dfs(step: int) -> bool:
        if step in visiting:
            return True
        if step in visited:
            return False
        visiting.add(step)
        for neighbor in adjacency.get(step, set()):
            if dfs(neighbor):
                return True
        visiting.remove(step)
        visited.add(step)
        return False

    return any(dfs(step) for step in adjacency)


def _sync_node_connections(
    nodes: list[dict[str, object]],
    edges: list[dict[str, int | str]],
) -> None:
    incoming_by_step: dict[int, set[int]] = defaultdict(set)
    outgoing_by_step: dict[int, set[int]] = defaultdict(set)
    incoming_types_by_step: dict[int, set[tuple[int, str]]] = defaultdict(set)

    for edge in edges:
        src = edge.get("from_step")
        dst = edge.get("to_step")
        edge_type = edge.get("type")
        if not isinstance(src, int) or not isinstance(dst, int) or not isinstance(edge_type, str):
            continue

        outgoing_by_step[src].add(dst)
        incoming_by_step[dst].add(src)
        incoming_types_by_step[dst].add((src, edge_type))

    for node in nodes:
        step = node.get("step")
        if not isinstance(step, int):
            node["input_connected_from"] = []
            node["output_connected_to"] = []
            node["input_data_type_from_previous"] = []
            continue

        node["input_connected_from"] = sorted(incoming_by_step.get(step, set()))
        node["output_connected_to"] = sorted(outgoing_by_step.get(step, set()))
        node["input_data_type_from_previous"] = [
            {"from_step": src, "type": edge_type}
            for src, edge_type in sorted(incoming_types_by_step.get(step, set()))
        ]


@router.patch("/{pipeline_id}/graph", response_model=PipelineGraphUpdateResponse)
async def update_pipeline_graph(
    pipeline_id: UUID,
    payload: PipelineGraphUpdateRequest,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    trace_id = getattr(request.state, "traceId", None)

    pipeline = await session.get(Pipeline, pipeline_id)
    if pipeline is None:
        log_business_event(
            "pipeline_graph_update_rejected",
            trace_id=trace_id,
            user_id=str(current_user.id),
            pipeline_id=str(pipeline_id),
            reason="pipeline_not_found",
        )
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pipeline not found")

    if current_user.role != UserRole.ADMIN and pipeline.created_by != current_user.id:
        log_business_event(
            "pipeline_graph_update_rejected",
            trace_id=trace_id,
            user_id=str(current_user.id),
            pipeline_id=str(pipeline_id),
            reason="pipeline_not_owned",
        )
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pipeline not found")

    nodes = [node.model_dump(mode="json") for node in payload.nodes]
    edges = [edge.model_dump(mode="json") for edge in payload.edges]

    validation_errors: list[str] = []
    steps: set[int] = set()
    for node in nodes:
        step = node.get("step")
        if not isinstance(step, int):
            validation_errors.append("graph: invalid_step")
            continue
        if step in steps:
            validation_errors.append(f"graph: duplicate_node_step:{step}")
            continue
        steps.add(step)

    normalized_edges: list[dict[str, int | str]] = []
    seen_edges: set[tuple[int, int, str]] = set()

    for edge in edges:
        src = edge.get("from_step")
        dst = edge.get("to_step")
        edge_type = str(edge.get("type") or "").strip()

        if not isinstance(src, int) or not isinstance(dst, int):
            validation_errors.append("graph: invalid_edge_reference")
            continue

        if src not in steps or dst not in steps:
            validation_errors.append(f"graph: edge_to_missing_node:{src}->{dst}")
            continue

        if src == dst:
            validation_errors.append(f"graph: self_loop:{src}")
            continue

        if not edge_type:
            validation_errors.append("graph: invalid_edge_type")
            continue

        edge_key = (src, dst, edge_type)
        if edge_key in seen_edges:
            validation_errors.append(
                f"graph: duplicate_edge:{src}->{dst}:{edge_type}"
            )
            continue

        seen_edges.add(edge_key)
        normalized_edges.append({"from_step": src, "to_step": dst, "type": edge_type})

    if normalized_edges and _graph_has_cycle(steps, normalized_edges):
        validation_errors.append("graph: cycle")

    if validation_errors:
        log_business_event(
            "pipeline_graph_update_rejected",
            trace_id=trace_id,
            user_id=str(current_user.id),
            pipeline_id=str(pipeline_id),
            reason="invalid_graph",
            errors=sorted(set(validation_errors)),
        )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "Invalid pipeline graph",
                "errors": sorted(set(validation_errors)),
            },
        )

    _sync_node_connections(nodes, normalized_edges)

    pipeline.nodes = nodes
    pipeline.edges = normalized_edges
    await session.commit()
    await session.refresh(pipeline)

    log_business_event(
        "pipeline_graph_updated",
        trace_id=trace_id,
        user_id=str(current_user.id),
        pipeline_id=str(pipeline.id),
        nodes_count=len(nodes),
        edges_count=len(normalized_edges),
    )

    return PipelineGraphUpdateResponse(
        pipeline_id=pipeline.id,
        nodes=pipeline.nodes,
        edges=pipeline.edges,
        updated_at=pipeline.updated_at,
    )
