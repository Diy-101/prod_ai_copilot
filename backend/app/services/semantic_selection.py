from __future__ import annotations

import re
from typing import NamedTuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Capability


class SelectedCapability(NamedTuple):
    capability: Capability
    score: float


class SemanticSelectionService:
    _STOPWORDS = {
        "and",
        "the",
        "for",
        "with",
        "from",
        "into",
        "that",
        "this",
        "что",
        "это",
        "как",
        "для",
        "или",
        "при",
        "про",
        "надо",
        "нужно",
        "хочу",
        "build",
        "pipeline",
        "workflow",
        "scenario",
        "automation",
        "пайплайн",
        "сценарий",
        "автоматизация",
        "построй",
        "собери",
    }

    async def select_capabilities(
        self,
        session: AsyncSession,
        user_query: str,
        limit: int = 10,
    ) -> list[SelectedCapability]:
        query_tokens = self._tokenize(user_query)
        if not query_tokens:
            return []

        query = select(Capability).order_by(Capability.created_at.asc()).limit(200)
        result = await session.execute(query)
        capabilities = list(result.scalars().all())
        ranked: list[SelectedCapability] = []
        for capability in capabilities:
            score = self._score_capability(query_tokens, capability)
            if score <= 0:
                continue
            ranked.append(SelectedCapability(capability=capability, score=score))

        ranked.sort(key=lambda item: item.score, reverse=True)
        strong_matches = [item for item in ranked if item.score >= 0.34]
        if strong_matches:
            return strong_matches[:limit]

        return []

    def _score_capability(self, query_tokens: set[str], capability: Capability) -> float:
        name = str(getattr(capability, "name", "") or "")
        description = str(getattr(capability, "description", "") or "")
        name_tokens = self._tokenize(name)
        description_tokens = self._tokenize(description)
        semantic_tokens = self._semantic_tokens(capability)
        combined_tokens = name_tokens | description_tokens | semantic_tokens
        if not combined_tokens:
            return 0.0

        overlap = query_tokens & combined_tokens
        if not overlap:
            return 0.0

        overlap_ratio = len(overlap) / len(query_tokens)
        name_ratio = len(query_tokens & name_tokens) / len(query_tokens)
        semantic_ratio = len(query_tokens & semantic_tokens) / len(query_tokens)
        exact_bonus = 0.25 if query_tokens <= combined_tokens else 0.0
        return max(overlap_ratio, name_ratio * 1.15, semantic_ratio * 1.35) + exact_bonus

    def _tokenize(self, value: str) -> set[str]:
        tokens = set(re.findall(r"[a-zA-Zа-яА-Я0-9]+", value.lower()))
        return {
            token
            for token in tokens
            if len(token) >= 3 and token not in self._STOPWORDS
        }

    def _semantic_tokens(self, capability: Capability) -> set[str]:
        llm_payload = getattr(capability, "llm_payload", None)
        if not isinstance(llm_payload, dict):
            return set()
        semantic = llm_payload.get("semantic")
        if not isinstance(semantic, dict):
            return set()

        parts: list[str] = []
        for key in ("operation_id", "capability_role"):
            value = semantic.get(key)
            if isinstance(value, str):
                parts.append(value)
        for key in ("tags", "consumes", "produces"):
            value = semantic.get(key)
            if isinstance(value, list):
                parts.extend(str(item) for item in value if item)

        return self._tokenize(" ".join(parts))
