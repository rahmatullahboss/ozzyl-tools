from __future__ import annotations

import pytest

from app.halal_catalog import DOCUMENT_TYPES, TOOLS


def test_home_is_accessible_and_secure(client):
    response = client.get("/")
    assert response.status_code == 200
    assert b"Free online tools that turn daily work" in response.data
    assert b"FAQPage" in response.data
    assert b"Organization" in response.data
    assert b"ContactPoint" in response.data
    assert b'id="report-problem"' in response.data
    assert b"Report%20a%20problem%20on%20Ozzyl%20Tools" in response.data
    assert b"Tool%20suggestion%20for%20Ozzyl%20Tools" in response.data
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    csp = response.headers["Content-Security-Policy"]
    assert "script-src 'self' 'nonce-" in csp
    assert "script-src 'self' 'unsafe-inline'" not in csp
    assert "object-src 'none'" in csp


@pytest.mark.parametrize("tool", TOOLS, ids=lambda tool: tool["slug"])
def test_each_public_calculator_route_renders(client, tool):
    response = client.get(f"/tools/{tool['slug']}/")
    assert response.status_code == 200
    assert tool["name"].encode() in response.data
    assert b"data-calculator=" in response.data
    assert b"FAQPage" in response.data
    assert b"BreadcrumbList" in response.data


def test_interest_and_borrowing_calculators_are_removed(client):
    removed_paths = (
        "/tools/loan-payment-calculator/",
        "/tools/compound-growth-calculator/",
        "/tools/debt-to-income-calculator/",
        "/tools/loan-to-value-calculator/",
        "/tools/mortgage-affordability-calculator/",
        "/tools/debt-payoff-calculator/",
        "/tools/savings-goal-calculator/",
        "/tools/cagr-calculator/",
        "/tools/npv-irr-calculator/",
        "/tools/target-margin-pricing-calculator/",
    )
    for path in removed_paths:
        assert client.get(path).status_code == 404

    slugs = {tool["slug"] for tool in TOOLS}
    assert "loan-payment-calculator" not in slugs
    assert "compound-growth-calculator" not in slugs


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


def test_about_page_renders(client):
    response = client.get("/about/")
    assert response.status_code == 200
    assert b"About Ozzyl Tools" in response.data
    assert b"AboutPage" in response.data


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
    assert b"word-unscrambler" in sitemap.data
    assert b"word-counter" in sitemap.data
    assert b"case-converter" in sitemap.data
    assert b"percentage-calculator" in sitemap.data
    assert b"password-generator" in sitemap.data
    assert b"/about/" in sitemap.data
    assert b"<lastmod>2026-07-17</lastmod>" in sitemap.data
    assert b"loan-payment-calculator" not in sitemap.data
    assert b"compound-growth-calculator" not in sitemap.data
    assert b"mortgage-affordability-calculator" not in sitemap.data
    assert b"debt-payoff-calculator" not in sitemap.data
    assert b"npv-irr-calculator" not in sitemap.data

    robots = client.get("/robots.txt")
    assert robots.status_code == 200
    assert b"Sitemap:" in robots.data
    assert b"User-agent: GPTBot" in robots.data
    assert b"User-agent: ClaudeBot" in robots.data
    assert b"User-agent: PerplexityBot" in robots.data

    llms = client.get("/llms.txt")
    assert llms.status_code == 200
    assert b"# Ozzyl Tools" in llms.data
    assert b"Profit Margin Calculator" in llms.data
    assert b"loan-payment-calculator" not in llms.data
    assert b"mortgage-affordability-calculator" not in llms.data
    assert b"npv-irr-calculator" not in llms.data


def test_error_page(client):
    response = client.get("/does-not-exist/")
    assert response.status_code == 404
    assert b"That page is not here" in response.data
