import json

from fastapi.testclient import TestClient

from src.main import app


def test_ingest_creates_registry(tmp_path, monkeypatch):
    registry_path = tmp_path / "registry.json"
    monkeypatch.setenv("REGISTRY_PATH", str(registry_path))
    monkeypatch.setenv("OLLAMA_DISABLE", "1")

    client = TestClient(app)
    payload = {
        "source_name": "sample-api",
        "openapi_spec": {
            "info": {"title": "Sample API"},
            "paths": {
                "/customers": {
                    "get": {
                        "operationId": "customers.search",
                        "summary": "Search customers",
                        "responses": {"200": {"description": "ok"}},
                    }
                }
            },
        },
    }
    response = client.post("/ingest/openapi", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["artifacts"]["compressed"] is True
    assert registry_path.exists()

    registry = json.loads(registry_path.read_text(encoding="utf-8"))
    assert "sample-api" in registry["services"]
    compressed = registry["services"]["sample-api"]["compressed"]
    assert compressed["capability_count"] == 1
