from __future__ import annotations

import html

import pytest

from app.finance_tools import FINANCE_TOOLS
from app.pdf_convert import PDF_CONVERT_TOOLS


@pytest.mark.parametrize("tool", FINANCE_TOOLS, ids=lambda tool: tool["slug"])
def test_each_finance_tool_renders(client, tool):
    response = client.get(f"/tools/{tool['slug']}/")

    assert response.status_code == 200
    assert html.escape(tool["name"]).encode() in response.data
    assert f'data-formula="{tool["formula"]}"'.encode() in response.data
    assert b"finance-tools.js" in response.data


@pytest.mark.parametrize("tool", PDF_CONVERT_TOOLS, ids=lambda tool: tool["slug"])
def test_each_pdf_conversion_tool_renders(client, tool):
    response = client.get(f"/tools/{tool['slug']}/")

    assert response.status_code == 200
    assert tool["name"].encode() in response.data
    assert f'data-pdf-convert="{tool["kind"]}"'.encode() in response.data
    assert b"pdf-convert.js" in response.data
    csp = response.headers["Content-Security-Policy"]
    assert "https://unpkg.com" in csp
    assert "worker-src 'self' blob: https://unpkg.com" in csp


def test_home_lists_new_finance_and_pdf_tools(client):
    response = client.get("/")

    assert response.status_code == 200
    for tool in [*FINANCE_TOOLS, *PDF_CONVERT_TOOLS]:
        assert html.escape(tool["short_name"]).encode() in response.data


def test_sitemap_lists_new_finance_and_pdf_tools(client):
    response = client.get("/sitemap.xml")

    assert response.status_code == 200
    for tool in [*FINANCE_TOOLS, *PDF_CONVERT_TOOLS]:
        assert tool["slug"].encode() in response.data
