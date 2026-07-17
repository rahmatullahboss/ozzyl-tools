from __future__ import annotations

import html

import pytest

from app.utility_tools import CORE_UTILITY_TOOLS, UTILITY_TOOLS


@pytest.mark.parametrize("tool", CORE_UTILITY_TOOLS, ids=lambda tool: tool["slug"])
def test_each_core_utility_tool_renders(client, tool):
    response = client.get(f"/tools/{tool['slug']}/")

    assert response.status_code == 200
    assert tool["name"].encode() in response.data
    assert f'data-utility-kind="{tool["kind"]}"'.encode() in response.data
    assert b"utility-tools.js" in response.data


def test_home_lists_all_utilities(client):
    response = client.get("/")

    assert response.status_code == 200
    for tool in UTILITY_TOOLS:
        expected_name = html.escape(tool["short_name"]).encode()
        assert expected_name in response.data
