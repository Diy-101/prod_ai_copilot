from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_travel_linear_workflow() -> None:
    users = client.get("/users/recent", params={"limit": 4}).json()["users"]
    hotels = client.get("/hotels/top", params={"limit": 2}).json()["hotels"]

    segments = client.post(
        "/segments/hotel",
        json={"users": users, "hotels": hotels},
    ).json()["segments"]

    assignments = client.post(
        "/assignments/hotels",
        json={"segments": segments},
    ).json()["assignments"]

    response = client.post(
        "/emails/send-offers",
        json={"template_id": "offer_template_2026", "assignments": assignments},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["failed_count"] == 0
    assert body["sent_count"] == len(assignments)


def test_crm_linear_workflow() -> None:
    leads = client.get("/crm/leads/recent", params={"limit": 5}).json()["leads"]

    qualified = client.post(
        "/crm/leads/qualify",
        json={"leads": leads},
    ).json()["qualified_leads"]

    offers = client.post(
        "/crm/offers/prepare",
        json={"qualified_leads": qualified},
    ).json()["offers"]

    response = client.post("/crm/offers/send", json={"offers": offers})

    assert response.status_code == 200
    body = response.json()
    assert body["failed_count"] == 0
    assert body["sent_count"] == len(offers)
