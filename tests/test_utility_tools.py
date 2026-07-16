from __future__ import annotations

import pytest

from app.utility_tools import UTILITY_TOOLS


@pytest.mark.parametrize("tool", UTILITY_TOOLS, ids=lambda tool: tool["slug"])
def test_each_utility_tool_renders(client, tool):
    response = client.get(f"/tools/{tool['slug']}/")

    assert response.status_code == 200
    assert tool["name"].encode() in response.data
    assert f'data-utility-kind="{tool["kind"]}"'.encode() in response.data
    assert b"utility-tools.js" in response.data


def test_home_lists_new_utilities(client):
    response = client.get("/")

    assert response.status_code == 200
    for tool in UTILITY_TOOLS:
        assert tool["short_name"].encode() in response.data
