from httpx import AsyncClient, ASGITransport
import pytest
from app.main import app

@pytest.mark.asyncio
async def test_ping():
    # Отключаем lifespan, чтобы smoke тест не зависел от инициализации внешних сервисов.
    async with AsyncClient(transport=ASGITransport(app=app, lifespan="off"), base_url="http://test") as ac:
        response = await ac.get("/api/ping")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
