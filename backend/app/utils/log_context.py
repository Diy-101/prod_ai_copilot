from __future__ import annotations

from contextvars import ContextVar
from typing import Any


_trace_id_ctx: ContextVar[str | None] = ContextVar("trace_id", default=None)
_path_ctx: ContextVar[str | None] = ContextVar("path", default=None)
_method_ctx: ContextVar[str | None] = ContextVar("method", default=None)
_user_id_ctx: ContextVar[str | None] = ContextVar("user_id", default=None)


def set_request_context(*, trace_id: str | None, path: str | None, method: str | None) -> None:
    _trace_id_ctx.set(trace_id)
    _path_ctx.set(path)
    _method_ctx.set(method)


def set_user_context(*, user_id: str | None) -> None:
    _user_id_ctx.set(user_id)


def clear_log_context() -> None:
    _trace_id_ctx.set(None)
    _path_ctx.set(None)
    _method_ctx.set(None)
    _user_id_ctx.set(None)


def get_log_context() -> dict[str, Any]:
    payload: dict[str, Any] = {}

    trace_id = _trace_id_ctx.get()
    if trace_id:
        payload["trace_id"] = trace_id

    path = _path_ctx.get()
    if path:
        payload["path"] = path

    method = _method_ctx.get()
    if method:
        payload["method"] = method

    user_id = _user_id_ctx.get()
    if user_id:
        payload["user_id"] = user_id

    return payload
