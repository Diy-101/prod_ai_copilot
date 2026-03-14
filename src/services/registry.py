from __future__ import annotations

from datetime import datetime, timezone
import json
import os
from pathlib import Path
import threading
from typing import Any

_LOCK = threading.Lock()


def get_registry_path() -> Path:
    return Path(os.getenv("REGISTRY_PATH", "data/registry.json"))


def load_registry() -> dict[str, Any]:
    path = get_registry_path()
    if not path.exists():
        return _default_registry()
    try:
        with path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
    except (OSError, json.JSONDecodeError):
        return _default_registry()
    if not isinstance(data, dict):
        return _default_registry()
    data.setdefault("version", 1)
    data.setdefault("services", {})
    return data


def save_registry(data: dict[str, Any]) -> None:
    path = get_registry_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(".tmp")
    with tmp_path.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)
    os.replace(tmp_path, path)


def build_registry(source_name: str, compressed_spec: dict[str, Any]) -> dict[str, Any]:
    with _LOCK:
        registry = load_registry()
        timestamp = datetime.now(timezone.utc).isoformat()
        services = registry.setdefault("services", {})
        services[source_name] = {
            "source_name": source_name,
            "updated_at": timestamp,
            "compressed": compressed_spec,
        }
        registry["updated_at"] = timestamp
        save_registry(registry)
    return {
        "registry_built": True,
        "registry_id": "file_registry",
        "source_name": source_name,
    }


def get_compressed_for_sources(source_names: list[str]) -> list[dict[str, Any]]:
    registry = load_registry()
    services = registry.get("services", {})
    results: list[dict[str, Any]] = []
    if not isinstance(services, dict):
        return results
    for name in source_names:
        entry = services.get(name)
        if isinstance(entry, dict):
            compressed = entry.get("compressed")
            if isinstance(compressed, dict):
                results.append(compressed)
    return results


def _default_registry() -> dict[str, Any]:
    return {
        "version": 1,
        "services": {},
        "updated_at": None,
    }
