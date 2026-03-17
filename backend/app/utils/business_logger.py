from __future__ import annotations

import logging
import os
from typing import Any

from app.utils.log_context import get_log_context


business_logger = logging.getLogger("app.business")
EVENT_SCHEMA_VERSION = "1.0"
SERVICE_NAME = os.getenv("APP_SERVICE_NAME", "backend-api")


def _derive_event_group(event: str) -> tuple[str, str | None]:
    normalized = (event or "").strip().lower()

    if normalized.startswith("auth_"):
        return "auth", None

    if normalized.startswith("action_") or normalized.startswith("actions_"):
        return "actions", None

    if (
        normalized.startswith("capability_")
        or normalized.startswith("capabilities_")
        or normalized.startswith("composite_capability_")
    ):
        return "capabilities", None

    if normalized.startswith("pipeline_prompt_"):
        return "pipelines", "prompt"
    if normalized.startswith("pipeline_run_"):
        return "pipelines", "run"
    if normalized.startswith("pipeline_dialog_"):
        return "pipelines", "dialog"
    if normalized.startswith("pipeline_") or normalized.startswith("pipelines_"):
        return "pipelines", None

    if normalized.startswith("execution_run_"):
        return "executions", "run"
    if normalized.startswith("execution_step_"):
        return "executions", "step"
    if normalized.startswith("execution_") or normalized.startswith("executions_"):
        return "executions", None

    if normalized.startswith("user_") or normalized.startswith("users_"):
        return "users", None

    return "other", None


def _derive_event_outcome(event: str) -> str:
    normalized = (event or "").strip().lower()
    for suffix, outcome in (
        ("_succeeded", "success"),
        ("_created", "success"),
        ("_updated", "success"),
        ("_deleted", "success"),
        ("_processed", "success"),
        ("_finished", "success"),
        ("_failed", "failure"),
        ("_rejected", "failure"),
        ("_blocked", "failure"),
        ("_started", "progress"),
        ("_queued", "progress"),
        ("_received", "progress"),
        ("_listed", "read"),
        ("_fetched", "read"),
        ("_viewed", "read"),
    ):
        if normalized.endswith(suffix):
            return outcome
    return "unknown"


def log_business_event(event: str, **fields: Any) -> None:
    safe_fields: dict[str, Any] = {
        "event": event,
        "event_schema_version": EVENT_SCHEMA_VERSION,
        "service_name": SERVICE_NAME,
    }
    event_group, event_subgroup = _derive_event_group(event)
    event_outcome = _derive_event_outcome(event)

    if "event_group" not in fields:
        safe_fields["event_group"] = event_group
    if event_subgroup is not None and "event_subgroup" not in fields:
        safe_fields["event_subgroup"] = event_subgroup
    if "event_outcome" not in fields:
        safe_fields["event_outcome"] = event_outcome

    for key, value in get_log_context().items():
        if key not in fields:
            safe_fields[key] = value

    for key, value in fields.items():
        if isinstance(value, (str, int, float, bool)) or value is None:
            safe_fields[key] = value
        else:
            safe_fields[key] = str(value)

    business_logger.info(event, extra=safe_fields)
