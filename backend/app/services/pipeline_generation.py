from __future__ import annotations

import json
import os
import re
from typing import Any

from app.services.pipeline_prompt_builder import build_pipeline_generation_prompt
from app.services.semantic_selection import SelectedCapability


class PipelineGenerationError(Exception):
    pass


class PipelineGenerationService:
    def __init__(self) -> None:
        self.host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
        self.model = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")

    def generate_raw_graph(
        self,
        *,
        user_query: str,
        selected_capabilities: list[SelectedCapability],
    ) -> dict[str, Any]:
        prompt = build_pipeline_generation_prompt(
            user_query=user_query,
            selected_capabilities=selected_capabilities,
        )

        payload = self._call_model(prompt)
        if not isinstance(payload, dict):
            raise PipelineGenerationError("LLM returned non-JSON payload")

        self._validate_graph_payload(payload)
        return payload

    def _call_model(self, prompt: str) -> dict[str, Any] | None:
        try:
            from ollama import Client
        except Exception as exc:
            raise PipelineGenerationError("Ollama client is unavailable") from exc

        try:
            client = Client(host=self.host)
            response = client.chat(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a pipeline graph generator. "
                            "Return ONLY valid JSON object with keys: nodes, edges, variable_injections."
                        ),
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
                options={"temperature": 0},
            )
        except Exception as exc:
            raise PipelineGenerationError("Failed to call Ollama") from exc

        content = self._extract_message_content(response)
        if not content:
            raise PipelineGenerationError("LLM returned empty response")
        return self._parse_json_payload(content)

    @staticmethod
    def _extract_message_content(response: Any) -> str | None:
        if isinstance(response, dict):
            message = response.get("message")
            if isinstance(message, dict):
                content = message.get("content")
                if isinstance(content, str):
                    return content
            content = response.get("content")
            if isinstance(content, str):
                return content
            return None

        message = getattr(response, "message", None)
        if message is not None:
            content = getattr(message, "content", None)
            if isinstance(content, str):
                return content

        content = getattr(response, "content", None)
        if isinstance(content, str):
            return content
        return None

    @staticmethod
    def _parse_json_payload(content: str) -> dict[str, Any] | None:
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", content, re.DOTALL)
            if not match:
                return None
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                return None

    @staticmethod
    def _validate_graph_payload(payload: dict[str, Any]) -> None:
        required_keys = ("nodes", "edges", "variable_injections")
        missing = [key for key in required_keys if key not in payload]
        if missing:
            raise PipelineGenerationError(f"LLM JSON missing required keys: {', '.join(missing)}")
