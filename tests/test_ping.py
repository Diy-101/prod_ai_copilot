from fastapi.testclient import TestClient

from src.main import app


client = TestClient(app)


def test_ping() -> None:
    response = client.get("/ping")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["service"] == "ml-planner"
    assert payload["version"] == "0.1.0"
