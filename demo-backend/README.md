# demo-backend

Отдельный демо backend для простых линейных сценариев из
`openapi/all_linear_scenarios.yaml`.

## Запуск

```bash
cd demo-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8010
```

## Запуск в Docker

```bash
cd demo-backend
docker network create shop-network 2>/dev/null || true
docker compose up -d --build
```

Остановка:

```bash
docker compose down
```

## Что реализовано

Travel линейный сценарий:
- `GET /users/recent` (`operationId: getRecentUsers`)
- `GET /hotels/top` (`operationId: getTopHotels`)
- `POST /segments/hotel` (`operationId: segmentUsersByHotelPreferences`)
- `POST /assignments/hotels` (`operationId: assignUsersToHotels`)
- `POST /emails/send-offers` (`operationId: sendHotelOffersByEmail`)

CRM линейный сценарий:
- `GET /crm/leads/recent` (`operationId: getRecentLeads`)
- `POST /crm/leads/qualify` (`operationId: qualifyLeadsForOffer`)
- `POST /crm/offers/prepare` (`operationId: prepareOffersForLeads`)
- `POST /crm/offers/send` (`operationId: sendPreparedOffers`)

Swagger UI: `http://localhost:8010/docs`
OpenAPI JSON: `http://localhost:8010/openapi.json`

Для тестов импортируй в основной backend:
`demo-backend/openapi/all_linear_scenarios.yaml`

- `servers[0].url` = `http://demo-api:8010` (для backend-контейнера в `shop-network`)
- `servers[1].url` = `http://localhost:8010` (локальный запуск без Docker)
- `template_id` имеет `default`, поэтому one-click execution не требует ручного ввода

## Быстрая проверка пайплайна

```bash
BASE=http://localhost:8010

curl -s "$BASE/users/recent?limit=3" > /tmp/users.json
curl -s "$BASE/hotels/top?limit=2" > /tmp/hotels.json

jq -n \
  --argjson users "$(jq '.users' /tmp/users.json)" \
  --argjson hotels "$(jq '.hotels' /tmp/hotels.json)" \
  '{users:$users, hotels:$hotels}' \
  | curl -s -X POST "$BASE/segments/hotel" \
    -H 'content-type: application/json' -d @- > /tmp/segments.json

jq -n --argjson segments "$(jq '.segments' /tmp/segments.json)" '{segments:$segments}' \
  | curl -s -X POST "$BASE/assignments/hotels" \
    -H 'content-type: application/json' -d @- > /tmp/assignments.json

jq -n \
  --arg template_id "offer_template_2026" \
  --argjson assignments "$(jq '.assignments' /tmp/assignments.json)" \
  '{template_id:$template_id, assignments:$assignments}' \
  | curl -s -X POST "$BASE/emails/send-offers" \
    -H 'content-type: application/json' -d @-
```
