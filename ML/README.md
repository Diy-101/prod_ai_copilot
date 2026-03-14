# ML Planner Service (Prototype)

Minimal FastAPI backend service for an ML planner prototype with stub business logic.

## Requirements

- Python 3.11+

## Install

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
```

## Run locally

```bash
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

## Healthcheck

```bash
curl -X GET http://127.0.0.1:8000/ping
```

Expected response:

```json
{
  "status": "ok",
  "service": "ml-planner",
  "version": "0.1.0"
}
```

## Ingest OpenAPI stub

```bash
curl -X POST http://127.0.0.1:8000/ingest/openapi \
  -H "Content-Type: application/json" \
  -d '{
    "source_name": "sample-api",
    "openapi_spec": {
      "paths": {
        "/customers": {},
        "/campaigns": {}
      },
      "components": {
        "schemas": {
          "Customer": {},
          "Campaign": {}
        }
      }
    }
  }'
```

## Plan stub

```bash
curl -X POST http://127.0.0.1:8000/plan \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Create an audience and draft campaign",
    "top_k": 2
  }'
```

## Run tests

```bash
pytest -q
```

## CI/CD (GitLab)

Pipeline stages:
- `lint`
- `test`
- `build` (Docker image build and push)
- `deploy` (SSH to server + `docker compose up -d`)

Required GitLab CI/CD variables:
- `CI_REGISTRY_USER`
- `CI_REGISTRY_PASSWORD`
- `SSH_PRIVATE_KEY`
- `SSH_KNOWN_HOSTS`
- `SERVER_USER`
- `SERVER_IP`
- `DEPLOY_PATH` (absolute path on server where `docker-compose.yml` lives)
