from __future__ import annotations

from types import SimpleNamespace

from app.services.semantic_selection import SemanticSelectionService


def test_score_maps_ru_users_query_to_en_capability_tokens():
    service = SemanticSelectionService()
    query_tokens = service._tokenize("Хочу получить пользователей")
    query_tokens_expanded = service._expand_tokens(query_tokens)
    capability = SimpleNamespace(
        name="get_users",
        description="Get users list",
    )

    score = service._score_capability(query_tokens, query_tokens_expanded, capability)

    assert score >= 0.45
