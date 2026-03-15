import os
import json
from typing import List, Tuple, Optional
from redis import asyncio as aioredis

class DialogMemoryService:
    def __init__(self):
        redis_host = os.getenv("REDIS_HOST", "localhost")
        redis_port = os.getenv("REDIS_PORT", "6379")
        redis_url = os.getenv("REDIS_URL", f"redis://{redis_host}:{redis_port}")
        self.redis = aioredis.from_url(redis_url, encoding="utf8", decode_responses=True)

    async def get_context(self, dialog_id: str) -> Tuple[List[dict], Optional[str]]:
        """
        Возвращает историю сообщений и последнее резюме контекста.
        """
        history_key = f"chat:history:{dialog_id}"
        summary_key = f"chat:summary:{dialog_id}"
        
        try:
            history_data = await self.redis.get(history_key)
            summary = await self.redis.get(summary_key)
            
            history = json.loads(history_data) if history_data else []
            return history, summary
        except Exception:
            return [], None

    async def append_and_summarize(self, dialog_id: str, role: str, content: str) -> str:
        """
        Добавляет сообщение в историю и обновляет резюме.
        """
        history_key = f"chat:history:{dialog_id}"
        summary_key = f"chat:summary:{dialog_id}"
        
        try:
            history_data = await self.redis.get(history_key)
            history = json.loads(history_data) if history_data else []
            
            history.append({"role": role, "content": content})
            
            # Ограничиваем историю последних 20 сообщений
            if len(history) > 20:
                history = history[-20:]
                
            await self.redis.set(history_key, json.dumps(history))
            
            # Заглушка для резюме
            summary = f"История диалога: {len(history)} сообщений."
            await self.redis.set(summary_key, summary)
            
            return summary
        except Exception:
            return "Ошибка доступа к памяти диалога"
