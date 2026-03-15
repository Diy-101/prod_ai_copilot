from typing import NamedTuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Capability

class SelectedCapability(NamedTuple):
    capability: Capability
    score: float

class SemanticSelectionService:
    async def select_capabilities(
        self,
        session: AsyncSession,
        user_query: str,
        limit: int = 10,
    ) -> list[SelectedCapability]:
        """
        Заглушка для семантического поиска. 
        В будущем здесь будет векторный поиск.
        Сейчас возвращаем последние добавленные возможности.
        """
        query = select(Capability).limit(limit)
        result = await session.execute(query)
        capabilities = result.scalars().all()
        
        # Назначаем фиктивный скор для совместимости
        return [SelectedCapability(capability=c, score=1.0) for c in capabilities]
