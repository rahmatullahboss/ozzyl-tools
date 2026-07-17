from __future__ import annotations

import html

import pytest

from app.growth_tools import GROWTH_TOOLS
from app.pdf_markup import PDF_MARKUP_TOOLS


@pytest.mark.parametrize("tool", GROWTH_TOOLS, ids=lambda tool: tool["slug"])
def test_each_growth_tool_renders(client, tool):
    response = client.get(f"/tools/{tool['slug']}/")

    assert response.status_code == 200
    assert html.escape(tool["name"]).encode() in response.data
    assert f'data-formula="{tool["formula"]}"'.encode() in response.data
    assert b"growth-tools.js" in response.data


@pytest.mark.parametrize("tool", PDF_MARKUP_TOOLS, ids=lambda tool: tool["slug"])
def test_each_pdf_markup_tool_renders(client, tool):
    response = client.get(f"/tools/{tool['slug']}/")

    assert response.status_code == 200
    assert tool["name"].encode() in response.data
    assert f'data-pdf-markup="{tool["kind"]}"'.encode() in response.data
    assert b"pdf-markup.js" in response.data
    csp = response.headers["Content-Security-Policy"]
    assert "https://unpkg.com" in csp
    assert "worker-src 'self' blob: https://unpkg.com" in csp


def test_home_lists_growth_and_pdf_markup_tools(client):
    response = client.get("/")

    assert response.status_code == 200
    for tool in [*GROWTH_TOOLS, *PDF_MARKUP_TOOLS]:
        assert html.escape(tool["short_name"]).encode() in response.data


def test_sitemap_lists_growth_and_pdf_markup_tools(client):
    response = client.get("/sitemap.xml")

    assert response.status_code == 200
    for tool in [*GROWTH_TOOLS, *PDF_MARKUP_TOOLS]:
        assert tool["slug"].encode() in response.data
