from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field


router = APIRouter(prefix="/v1/demo", tags=["Demo"])


class ProcessUsersRequest(BaseModel):
    users: list[dict[str, Any]] = Field(default_factory=list)


class DeliverSegmentsRequest(BaseModel):
    segments: list[dict[str, Any]] = Field(default_factory=list)


@router.get("/users/source")
async def demo_get_users_source() -> dict[str, Any]:
    return {
        "users": [
            {"id": 1, "email": "alice@example.com", "spend": 1200, "country": "RU"},
            {"id": 2, "email": "bob@example.com", "spend": 80, "country": "US"},
            {"id": 3, "email": "carol@example.com", "spend": 450, "country": "RU"},
        ]
    }


@router.post("/users/process")
async def demo_process_users(payload: ProcessUsersRequest) -> dict[str, Any]:
    vip_users = [
        user
        for user in payload.users
        if isinstance(user, dict) and float(user.get("spend", 0) or 0) >= 400
    ]
    segments = [
        {
            "segment": "vip",
            "size": len(vip_users),
            "emails": [str(user.get("email")) for user in vip_users if user.get("email")],
        }
    ]
    return {"segments": segments}


@router.post("/users/deliver")
async def demo_deliver_segments(payload: DeliverSegmentsRequest) -> dict[str, Any]:
    return {
        "result": {
            "delivered_segments": payload.segments,
            "status": "ok",
            "delivered_at": datetime.now(timezone.utc).isoformat(),
        }
    }

