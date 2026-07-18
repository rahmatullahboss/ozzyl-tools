from __future__ import annotations

import html

import pytest

from app.growth_tools import GROWTH_TOOLS
from app.halal_catalog import DOCUMENT_TYPES, TOOLS
from app.pdf_convert import PDF_CONVERT_TOOLS
from app.pdf_lab import PDF_LAB_TOOLS
from app.pdf_markup import PDF_MARKUP_TOOLS
from app.pdf_tools import PDF_TOOLS
from app.tool_directory import (
    DIRECTORY_GROUPS,
    DIRECTORY_ITEMS,
    DIRECTORY_ITEMS_BY_GROUP,
    DIRECTORY_ITEMS_BY_SLUG,
)
from app.utility_tools import UTILITY_TOOLS


def test_directory_catalog_is_unique_complete_and_grouped():
    assert len(DIRECTORY_ITEMS) == len(DIRECTORY_ITEMS_BY_SLUG)
    assert set(DIRECTORY_ITEMS_BY_GROUP) == set(DIRECTORY_GROUPS)
    assert all(DIRECTORY_ITEMS_BY_GROUP[group] for group in DIRECTORY_GROUPS)
    assert sum(len(items) for items in DIRECTORY_ITEMS_BY_GROUP.values()) == len(DIRECTORY_ITEMS)

    for item in DIRECTORY_ITEMS:
        assert item["group"] in DIRECTORY_GROUPS
        assert item["endpoint"]
        assert item["search_text"]
        assert item["slug"] in DIRECTORY_ITEMS_BY_SLUG


def test_directory_uses_only_approved_public_registries():
    approved_slugs = {tool["slug"] for tool in TOOLS}
    approved_slugs.update(tool["slug"] for tool in GROWTH_TOOLS)
    approved_slugs.update(tool["slug"] for tool in UTILITY_TOOLS)
    approved_slugs.update(tool["slug"] for tool in PDF_TOOLS)
    approved_slugs.update(tool["slug"] for tool in PDF_LAB_TOOLS)
    approved_slugs.update(tool["slug"] for tool in PDF_CONVERT_TOOLS)
    approved_slugs.update(tool["slug"] for tool in PDF_MARKUP_TOOLS)
    approved_slugs.update(f"{kind}-generator" for kind in DOCUMENT_TYPES)
    approved_slugs.add("word-unscrambler")

    assert set(DIRECTORY_ITEMS_BY_SLUG) == approved_slugs


def test_complete_directory_renders_every_public_item(client):
    response = client.get("/tools/")

    assert response.status_code == 200
    assert b"All free online tools in one directory" in response.data
    assert b'"@type":"ItemList"' in response.data
    assert b"tool-directory.js" in response.data
    assert b"tool-directory.css" in response.data
    assert response.data.count(b"data-directory-item") == len(DIRECTORY_ITEMS)
    for group in DIRECTORY_GROUPS.values():
        assert html.escape(group["name"]).encode() in response.data


@pytest.mark.parametrize("group_slug", DIRECTORY_GROUPS)
def test_each_category_landing_page_renders(client, group_slug):
    response = client.get(f"/tools/category/{group_slug}/")

    assert response.status_code == 200
    group = DIRECTORY_GROUPS[group_slug]
    assert html.escape(group["title"]).encode() in response.data
    assert response.data.count(b"data-directory-item") == len(DIRECTORY_ITEMS_BY_GROUP[group_slug])
    assert b"CollectionPage" in response.data
    assert b"BreadcrumbList" in response.data


def test_unknown_directory_category_returns_404(client):
    assert client.get("/tools/category/not-a-real-category/").status_code == 404


def test_public_search_index_contains_safe_resolved_urls(client):
    response = client.get("/tools-index.json")

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["count"] == len(DIRECTORY_ITEMS)
    assert len(payload["tools"]) == len(DIRECTORY_ITEMS)
    assert len({tool["slug"] for tool in payload["tools"]}) == len(DIRECTORY_ITEMS)
    assert all(tool["url"].startswith("/") for tool in payload["tools"])
    assert all("search_text" in tool for tool in payload["tools"])


def test_directory_is_linked_from_navigation_and_discovery_files(client):
    home = client.get("/")
    sitemap = client.get("/sitemap.xml")
    llms = client.get("/llms.txt")

    assert b'href="/tools/"' in home.data
    assert b"global-tool-search.js" in home.data
    assert b"/tools/</loc>" in sitemap.data
    assert b"## Tool directory" in llms.data
    assert b"[All Tools]" in llms.data
    for group_slug, group in DIRECTORY_GROUPS.items():
        path = f"/tools/category/{group_slug}/".encode()
        assert path in sitemap.data
        assert group["name"].encode() in llms.data
