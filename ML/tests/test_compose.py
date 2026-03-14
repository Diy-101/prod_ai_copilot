from fastapi.testclient import TestClient

from src.main import app


def test_compose_plan_returns_steps(tmp_path, monkeypatch):
    registry_path = tmp_path / "registry.json"
    monkeypatch.setenv("REGISTRY_PATH", str(registry_path))
    monkeypatch.setenv("OLLAMA_DISABLE", "1")

    client = TestClient(app)
    ingest_payload = {
        "source_name": "sample-api",
        "openapi_spec": {
            "info": {"title": "Sample API"},
            "paths": {
                "/customers": {
                    "get": {
                        "summary": "Search customers",
                        "responses": {"200": {"description": "ok"}},
                    }
                }
            },
        },
    }
    ingest_response = client.post("/ingest/openapi", json=ingest_payload)
    assert ingest_response.status_code == 200

    compose_payload = {
        "task": "Find customers",
        "source_names": ["sample-api"],
        "top_k": 3,
        "max_steps": 2,
    }
    response = client.post("/plan/compose", json=compose_payload)
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["steps"]
    assert body["steps"][0]["capability"]
    assert body["steps"][0]["source_name"] == "sample-api"
