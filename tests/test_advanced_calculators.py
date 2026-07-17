from __future__ import annotations

import pytest

from app.catalog import TOOLS


@pytest.mark.parametrize("tool", TOOLS, ids=lambda tool: tool["slug"])
def test_each_calculator_has_advanced_analysis(client, tool):
    response = client.get(f"/tools/{tool['slug']}/")

    assert response.status_code == 200
    assert b"data-scenario-toggle" in response.data
    assert b"data-sensitivity-table" in response.data
    assert b"data-export-analysis" in response.data
    assert b"advanced-calculator.css" in response.data


def test_loan_calculator_has_extra_payment_projection(client):
    response = client.get("/tools/loan-payment-calculator/")

    assert response.status_code == 200
    assert b"data-loan-extra-payment" in response.data
    assert b"data-projection-table" in response.data
