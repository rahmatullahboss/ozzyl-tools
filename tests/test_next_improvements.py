from __future__ import annotations

import html

import pytest

from app.pdf_lab import PDF_LAB_TOOLS


@pytest.mark.parametrize("tool", PDF_LAB_TOOLS, ids=lambda tool: tool["slug"])
def test_each_pdf_lab_tool_renders(client, tool):
    response = client.get(f"/tools/{tool['slug']}/")

    assert response.status_code == 200
    assert html.escape(tool["name"]).encode() in response.data
    assert f'data-pdf-lab="{tool["kind"]}"'.encode() in response.data
    assert b"pdf-lab.js" in response.data
    assert "https://unpkg.com" in response.headers["Content-Security-Policy"]


def test_home_lists_pdf_lab_tools(client):
    response = client.get("/")

    assert response.status_code == 200
    for tool in PDF_LAB_TOOLS:
        assert html.escape(tool["short_name"]).encode() in response.data


def test_sitemap_lists_pdf_lab_tools(client):
    response = client.get("/sitemap.xml")

    assert response.status_code == 200
    for tool in PDF_LAB_TOOLS:
        assert tool["slug"].encode() in response.data
