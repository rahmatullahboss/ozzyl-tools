from __future__ import annotations

import html

import pytest

from app.seo_tools import SEO_TOOLS


@pytest.mark.parametrize("tool", SEO_TOOLS, ids=lambda tool: tool["slug"])
def test_each_seo_tool_renders(client, tool):
    response = client.get(f"/tools/{tool['slug']}/")

    assert response.status_code == 200
    assert html.escape(tool["name"]).encode() in response.data
    assert f'data-seo-tool="{tool["kind"]}"'.encode() in response.data
    assert b"seo-tools.js" in response.data
    assert b"seo-tools.css" in response.data
    assert b"WebApplication" in response.data
    assert b"BreadcrumbList" in response.data


def test_home_sitemap_and_llms_list_seo_tools(client):
    home = client.get("/")
    sitemap = client.get("/sitemap.xml")
    llms = client.get("/llms.txt")

    assert home.status_code == 200
    assert sitemap.status_code == 200
    assert llms.status_code == 200
    for tool in SEO_TOOLS:
        assert html.escape(tool["short_name"]).encode() in home.data
        assert tool["slug"].encode() in sitemap.data
        assert tool["name"].encode() in llms.data


def test_seo_tool_routes_are_unique(app):
    paths = [rule.rule for rule in app.url_map.iter_rules()]
    for tool in SEO_TOOLS:
        route = f"/tools/{tool['slug']}/"
        assert paths.count(route) == 1


def test_seo_tools_remain_halal_and_non_paid():
    serialized = " ".join(
        f"{tool['slug']} {tool['name']} {tool['summary']}" for tool in SEO_TOOLS
    ).lower()
    prohibited = ("interest", "mortgage", "betting", "gambling", "paid ads", "loan")
    assert all(term not in serialized for term in prohibited)
