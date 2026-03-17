from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone
from typing import Any

from app.utils.log_context import get_log_context

SERVICE_NAME = os.getenv("APP_SERVICE_NAME", "backend-api")


LOG_RECORD_RESERVED_FIELDS = set(
    logging.LogRecord(
        name="",
        level=0,
        pathname="",
        lineno=0,
        msg="",
        args=(),
        exc_info=None,
    ).__dict__.keys()
) | {"message", "asctime"}


def _normalize_extra_value(value: Any) -> Any:
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    if isinstance(value, (list, tuple)):
        return [_normalize_extra_value(item) for item in value]
    if isinstance(value, dict):
        normalized: dict[str, Any] = {}
        for key, nested_value in value.items():
            normalized[str(key)] = _normalize_extra_value(nested_value)
        return normalized
    return str(value)


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "service_name": SERVICE_NAME,
        }

        for key in (
            "event",
            "trace_id",
            "path",
            "method",
            "status_code",
            "duration_ms",
            "user_id",
            "email",
            "role",
            "dialog_id",
            "pipeline_id",
            "run_id",
            "result_status",
            "message_len",
            "capability_ids_count",
            "reason",
        ):
            value = getattr(record, key, None)
            if value is not None:
                payload[key] = value

        for key, value in record.__dict__.items():
            if key in LOG_RECORD_RESERVED_FIELDS or key in payload:
                continue
            payload[key] = _normalize_extra_value(value)

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload, ensure_ascii=True)


class RequestContextFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        for key, value in get_log_context().items():
            if getattr(record, key, None) is None:
                setattr(record, key, value)
        return True


def configure_logging() -> None:
    level = os.getenv("LOG_LEVEL", "INFO").upper()
    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.setLevel(level)

    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    handler.addFilter(RequestContextFilter())
    root_logger.addHandler(handler)
