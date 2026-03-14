from httpx import AsyncClient, ASGITransport
import pytest
from app.main import app

@pytest.mark.asyncio
async def test_ping():
    # Используем ASGITransport для современных версий httpx
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/ping")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
