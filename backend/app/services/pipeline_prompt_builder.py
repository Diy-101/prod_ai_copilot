from __future__ import annotations

import json

from app.services.semantic_selection import SelectedCapability


PROMPT_VERSION = "v1"


def build_pipeline_generation_prompt(
    *,
    user_query: str,
    selected_capabilities: list[SelectedCapability],
) -> str:
    capabilities_context = [
        {
            "id": str(item.capability.id),
            "name": item.capability.name,
            "description": item.capability.description,
            "input_schema": item.capability.input_schema,
            "output_schema": item.capability.output_schema,
            "data_format": item.capability.data_format,
            "score": item.score,
        }
        for item in selected_capabilities
    ]

    payload = {
        "instruction": (
            "Return ONLY valid JSON object. "
            "No markdown, no code fences, no explanations. "
            "JSON must include keys: nodes, edges, variable_injections."
        ),
        "user_query": user_query,
        "capabilities": capabilities_context,
    }
    return json.dumps(payload, ensure_ascii=True, indent=2)
