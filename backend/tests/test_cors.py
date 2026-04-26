from fastapi.testclient import TestClient

from app.main import app


def test_frontend_origin_can_read_api_responses():
    client = TestClient(app)

    response = client.get(
        "/health",
        headers={"Origin": "https://realrent-hazel.vercel.app"},
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "https://realrent-hazel.vercel.app"


def test_local_vite_origin_can_read_api_responses():
    client = TestClient(app)

    response = client.get(
        "/health",
        headers={"Origin": "http://localhost:5173"},
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
