from __future__ import annotations

import pytest

from app.pdf_tools import PDF_TOOLS


@pytest.mark.parametrize("tool", PDF_TOOLS, ids=lambda tool: tool["slug"])
def test_each_pdf_tool_renders(client, tool):
    response = client.get(f"/tools/{tool['slug']}/")

    assert response.status_code == 200
    assert tool["name"].encode() in response.data
    assert f'data-pdf-tool="{tool["kind"]}"'.encode() in response.data
    assert b"pdf-tools.js" in response.data
    assert "https://unpkg.com" in response.headers["Content-Security-Policy"]


def test_home_lists_pdf_tools(client):
    response = client.get("/")

    assert response.status_code == 200
    for tool in PDF_TOOLS:
        assert tool["short_name"].encode() in response.data


def test_sitemap_lists_pdf_tools(client):
    response = client.get("/sitemap.xml")

    assert response.status_code == 200
    for tool in PDF_TOOLS:
        assert tool["slug"].encode() in response.data
