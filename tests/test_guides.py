from __future__ import annotations

import html

import pytest

from app.guide_catalog import GUIDES, GUIDES_BY_SLUG


def test_guide_catalog_is_unique_and_substantial():
    assert len(GUIDES) == 5
    assert len(GUIDES_BY_SLUG) == len(GUIDES)

    for guide in GUIDES:
        assert guide["slug"] in GUIDES_BY_SLUG
        assert len(guide["sections"]) >= 5
        assert len(guide["takeaways"]) >= 4
        assert len(guide["checklist"]) >= 6
        assert guide["primary_tool"]["endpoint"]
        assert guide["context_tools"]
        assert guide["published"] <= guide["updated"]


def test_guides_hub_renders_every_guide(client):
    response = client.get("/guides/")

    assert response.status_code == 200
    assert b"Practical guides for completing real work correctly" in response.data
    assert b"CollectionPage" in response.data
    assert b"ItemList" in response.data
    assert b"BreadcrumbList" in response.data
    assert response.data.count(b'class="guide-card"') == len(GUIDES)
    for guide in GUIDES:
        assert html.escape(guide["short_title"]).encode() in response.data
        assert f'/guides/{guide["slug"]}/'.encode() in response.data


@pytest.mark.parametrize("guide", GUIDES, ids=lambda guide: guide["slug"])
def test_each_guide_renders_article_schema_and_workflow(client, guide):
    response = client.get(f'/guides/{guide["slug"]}/')

    assert response.status_code == 200
    assert html.escape(guide["title"]).encode() in response.data
    assert b'"@type": "Article"' in response.data
    assert b"BreadcrumbList" in response.data
    assert b"Key takeaways" in response.data
    assert b"Checklist before you finish" in response.data
    assert b"Related tools" in response.data
    assert b'"@type": "HowTo"' not in response.data


def test_unknown_guide_returns_404(client):
    assert client.get("/guides/not-a-real-guide/").status_code == 404


@pytest.mark.parametrize(
    ("path", "guide_slug"),
    [
        ("/tools/profit-margin-calculator/", "profit-margin-vs-markup"),
        ("/documents/invoice-generator/", "how-to-create-a-professional-invoice"),
        ("/tools/merge-pdf/", "how-to-merge-pdf-files-privately"),
        ("/tools/meta-tag-serp-preview/", "seo-meta-tags-title-description-canonical"),
        ("/tools/json-formatter-validator/", "how-to-format-and-validate-json"),
    ],
)
def test_contextual_guides_are_linked_from_matching_tools(client, path, guide_slug):
    response = client.get(path)

    assert response.status_code == 200
    assert b"Related practical guide" in response.data
    assert f'/guides/{guide_slug}/'.encode() in response.data
    assert b"Read the guide" in response.data


def test_unrelated_tool_does_not_show_contextual_guide(client):
    response = client.get("/tools/word-counter/")

    assert response.status_code == 200
    assert b"Related practical guide" not in response.data


def test_guides_are_linked_from_navigation_and_discovery(client):
    home = client.get("/")
    sitemap = client.get("/sitemap.xml")
    llms = client.get("/llms.txt")

    assert b'href="/guides/"' in home.data
    assert b"Practical guides" in home.data
    assert b"/guides/</loc>" in sitemap.data
    assert b"## Practical guides" in llms.data
    assert b"[Practical Guides]" in llms.data

    for guide in GUIDES:
        path = f'/guides/{guide["slug"]}/'.encode()
        assert path in sitemap.data
        assert guide["short_title"].encode() in llms.data


def test_external_sources_are_only_shown_when_present(client):
    seo = client.get("/guides/seo-meta-tags-title-description-canonical/")
    invoice = client.get("/guides/how-to-create-a-professional-invoice/")

    assert b"Reference sources" in seo.data
    assert b"Google Search Central" in seo.data
    assert b"Reference sources" not in invoice.data
