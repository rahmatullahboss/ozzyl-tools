from __future__ import annotations

import html

import pytest

from app.data_tools import DATA_TOOLS


@pytest.mark.parametrize("tool", DATA_TOOLS, ids=lambda tool: tool["slug"])
def test_each_data_tool_renders(client, tool):
    response = client.get(f"/tools/{tool['slug']}/")

    assert response.status_code == 200
    assert html.escape(tool["name"]).encode() in response.data
    assert f'data-data-tool="{tool["kind"]}"'.encode() in response.data
    if tool["kind"] == "qr":
        assert b"qr-tool.js" in response.data
    elif tool["kind"] == "regex":
        assert b"regex-tool.js" in response.data
    else:
        assert b"data-tools.js" in response.data


def test_home_lists_new_data_tools(client):
    response = client.get("/")

    assert response.status_code == 200
    for tool in DATA_TOOLS:
        assert html.escape(tool["short_name"]).encode() in response.data


def test_sitemap_lists_new_data_tools(client):
    response = client.get("/sitemap.xml")

    assert response.status_code == 200
    for tool in DATA_TOOLS:
        assert tool["slug"].encode() in response.data


def test_data_tool_routes_are_unique(app):
    paths = [rule.rule for rule in app.url_map.iter_rules()]
    for tool in DATA_TOOLS:
        route = f"/tools/{tool['slug']}/"
        assert paths.count(route) == 1
