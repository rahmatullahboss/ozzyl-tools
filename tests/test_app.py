import pytest

from app import create_app
from app.catalog import TOOLS


@pytest.fixture()
def client():
    app = create_app({"TESTING": True, "SITE_URL": "https://tools.example.com"})
    return app.test_client()


def test_home_page(client):
    response = client.get("/")
    assert response.status_code == 200
    assert b"Run the numbers" in response.data
    assert b"Invoice Generator" in response.data


def test_every_calculator_page(client):
    for tool in TOOLS:
        response = client.get(f"/tools/{tool['slug']}/")
        assert response.status_code == 200
        assert tool["name"].encode() in response.data


def test_document_generators(client):
    assert client.get("/invoice-generator/").status_code == 200
    assert client.get("/quotation-generator/").status_code == 200


def test_health(client):
    response = client.get("/health/")
    assert response.status_code == 200
    assert response.get_json()["status"] == "ok"


def test_sitemap_and_robots(client):
    sitemap = client.get("/sitemap.xml")
    assert sitemap.status_code == 200
    assert b"profit-margin-calculator" in sitemap.data
    robots = client.get("/robots.txt")
    assert b"Sitemap:" in robots.data


def test_not_found(client):
    assert client.get("/missing-page").status_code == 404
