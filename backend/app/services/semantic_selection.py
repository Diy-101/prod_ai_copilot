from __future__ import annotations

from dataclasses import dataclass
from typing import Sequence

from sqlalchemy import Text, case, cast, desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Capability


@dataclass
class SelectedCapability:
    capability: Capability
    score: float


class SemanticSelectionService:
    """
    Internal semantic selection adapter.
    Selects capabilities from DB by textual relevance without vector search.
    """

    async def select_capabilities(
        self,
        session: AsyncSession,
        user_query: str,
        limit: int = 5,
    ) -> list[SelectedCapability]:
        terms = [term.strip().lower() for term in user_query.split() if len(term.strip()) >= 2]
        if not terms:
            return []

        score_expression = None
        for term in terms:
            pattern = f"%{term}%"
            term_score = (
                case((Capability.name.ilike(pattern), 2.0), else_=0.0)
                + case((Capability.description.ilike(pattern), 1.5), else_=0.0)
                + case((cast(Capability.input_schema, Text).ilike(pattern), 1.0), else_=0.0)
                + case((cast(Capability.output_schema, Text).ilike(pattern), 1.0), else_=0.0)
                + case((cast(Capability.data_format, Text).ilike(pattern), 0.5), else_=0.0)
            )
            score_expression = term_score if score_expression is None else (score_expression + term_score)

        if score_expression is None:
            return []

        scored_query = (
            select(Capability, score_expression.label("score"))
            .where(score_expression > 0)
            .order_by(desc("score"), Capability.updated_at.desc())
            .limit(limit)
        )

        rows: Sequence[tuple[Capability, float]] = (await session.execute(scored_query)).all()
        return [SelectedCapability(capability=row[0], score=float(row[1])) for row in rows]
