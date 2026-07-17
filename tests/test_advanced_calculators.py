from __future__ import annotations

import pytest

from app.halal_catalog import TOOLS


@pytest.mark.parametrize("tool", TOOLS, ids=lambda tool: tool["slug"])
def test_each_public_calculator_has_advanced_analysis(client, tool):
    response = client.get(f"/tools/{tool['slug']}/")

    assert response.status_code == 200
    assert b"data-scenario-toggle" in response.data
    assert b"data-sensitivity-table" in response.data
    assert b"data-export-analysis" in response.data
    assert b"advanced-calculator.css" in response.data
    assert b"data-loan-extra-payment" not in response.data
