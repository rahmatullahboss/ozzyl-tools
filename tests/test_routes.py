from __future__ import annotations

import pytest

from app.catalog import DOCUMENT_TYPES, TOOLS


def test_home_is_accessible_and_secure(client):
    response = client.get("/")
    assert response.status_code == 200
    assert b"Business tools that turn numbers" in response.data
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    csp = response.headers["Content-Security-Policy"]
    assert "script-src 'self' 'nonce-" in csp
    assert "script-src 'self' 'unsafe-inline'" not in csp
    assert "object-src 'none'" in csp


@pytest.mark.parametrize("tool", TOOLS, ids=lambda tool: tool["slug"])
def test_each_calculator_route_renders(client, tool):
    response = client.get(f"/tools/{tool['slug']}/")
    assert response.status_code == 200
    assert tool["name"].encode() in response.data
    assert b"data-calculator=" in response.data


def test_word_unscrambler_renders(client):
    response = client.get("/tools/word-unscrambler/")
    assert response.status_code == 200
    assert b"data-word-unscrambler" in response.data
    assert b"word-unscrambler.js" in response.data
    assert "https://raw.githubusercontent.com" in response.headers["Content-Security-Policy"]


@pytest.mark.parametrize("document_type", DOCUMENT_TYPES)
def test_each_document_generator_renders(client, document_type):
    response = client.get(f"/documents/{document_type}-generator/")
    assert response.status_code == 200
    assert b"data-document-app" in response.data


def test_operational_endpoints(client):
    assert client.get("/health/").json == {"service": "ozzyl-tools", "status": "ok"}
    assert client.get("/ready/").status_code == 200
    assert client.get("/manifest.webmanifest").status_code == 200
    service_worker = client.get("/service-worker.js")
    assert service_worker.status_code == 200
    assert service_worker.headers["Service-Worker-Allowed"] == "/"


def test_seo_endpoints(client):
    sitemap = client.get("/sitemap.xml")
    assert sitemap.status_code == 200
    assert sitemap.mimetype == "application/xml"
    assert b"profit-margin-calculator" in sitemap.data
    robots = client.get("/robots.txt")
    assert robots.status_code == 200
    assert b"Sitemap:" in robots.data


def test_error_page(client):
    response = client.get("/does-not-exist/")
    assert response.status_code == 404
    assert b"That page is not here" in response.data
