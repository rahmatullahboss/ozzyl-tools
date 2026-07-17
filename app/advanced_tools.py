from __future__ import annotations

from flask import Blueprint, render_template

bp = Blueprint("advanced_tools", __name__)

ADVANCED_CALCULATOR_TOOLS = [
    {
        "slug": "savings-goal-calculator",
        "endpoint": "advanced_tools.savings_goal",
        "name": "Savings Goal Calculator",
        "short_name": "Savings Goal",
        "summary": "Calculate the monthly contribution needed to reach a savings target and review a year-by-year projection.",
        "category": "Finance",
        "icon": "target",
        "formula": "savings_goal",
        "sensitivity_key": "annual_rate",
        "sensitivity_label": "Estimated annual return",
        "inputs": [
            {
                "id": "goal",
                "label": "Savings goal",
                "value": 50000,
                "min": 0,
                "step": 0.01,
                "kind": "money",
            },
            {
                "id": "initial",
                "label": "Current savings",
                "value": 5000,
                "min": 0,
                "step": 0.01,
                "kind": "money",
            },
            {
                "id": "years",
                "label": "Time to goal",
                "value": 5,
                "min": 0.08,
                "step": 0.25,
                "kind": "years",
            },
            {
                "id": "annual_rate",
                "label": "Estimated annual return",
                "value": 6,
                "min": -99,
                "step": 0.01,
                "kind": "percent",
            },
        ],
        "results": [
            {
                "key": "monthly",
                "label": "Required monthly saving",
                "format": "currency",
            },
            {
                "key": "contributed",
                "label": "Total money contributed",
                "format": "currency",
            },
            {
                "key": "growth",
                "label": "Estimated investment growth",
                "format": "currency",
            },
            {"key": "shortfall", "label": "Starting shortfall", "format": "currency"},
        ],
        "formula_text": "Monthly saving is calculated with monthly compounding and end-of-month contributions.",
        "guide": "Use a conservative return estimate and compare lower-return scenarios before relying on the result.",
    },
    {
        "slug": "cagr-calculator",
        "endpoint": "advanced_tools.cagr",
        "name": "CAGR Calculator",
        "short_name": "CAGR",
        "summary": "Measure compound annual growth rate, total growth, and the implied yearly value path.",
        "category": "Planning",
        "icon": "trending-up",
        "formula": "cagr",
        "sensitivity_key": "ending",
        "sensitivity_label": "Ending value",
        "inputs": [
            {
                "id": "beginning",
                "label": "Beginning value",
                "value": 10000,
                "min": 0.01,
                "step": 0.01,
                "kind": "money",
            },
            {
                "id": "ending",
                "label": "Ending value",
                "value": 18000,
                "min": 0,
                "step": 0.01,
                "kind": "money",
            },
            {
                "id": "years",
                "label": "Number of years",
                "value": 4,
                "min": 0.01,
                "step": 0.25,
                "kind": "years",
            },
        ],
        "results": [
            {
                "key": "cagr",
                "label": "Compound annual growth rate",
                "format": "percent",
            },
            {
                "key": "absolute_growth",
                "label": "Absolute growth",
                "format": "currency",
            },
            {"key": "total_growth", "label": "Total growth", "format": "percent"},
            {"key": "multiple", "label": "Growth multiple", "format": "multiple"},
        ],
        "formula_text": "CAGR = (Ending value ÷ Beginning value)^(1 ÷ Years) − 1.",
        "guide": "CAGR smooths growth into one annual rate; it does not show volatility between the start and end dates.",
    },
    {
        "slug": "npv-irr-calculator",
        "endpoint": "advanced_tools.npv_irr",
        "name": "NPV & IRR Calculator",
        "short_name": "NPV & IRR",
        "summary": "Evaluate an investment using a custom cash-flow series, net present value, profitability index, and estimated IRR.",
        "category": "Finance",
        "icon": "chart-up",
        "formula": "npv",
        "sensitivity_key": "discount_rate",
        "sensitivity_label": "Discount rate",
        "inputs": [
            {
                "id": "initial",
                "label": "Initial investment",
                "value": 25000,
                "min": 0,
                "step": 0.01,
                "kind": "money",
            },
            {
                "id": "discount_rate",
                "label": "Discount rate",
                "value": 10,
                "min": -99,
                "step": 0.01,
                "kind": "percent",
            },
            {
                "id": "cash_flows",
                "label": "Annual cash flows",
                "value": "7000, 8000, 9000, 10000",
                "kind": "series",
                "placeholder": "Example: 7000, 8000, 9000, 10000",
            },
        ],
        "results": [
            {"key": "npv", "label": "Net present value", "format": "currency"},
            {"key": "irr", "label": "Estimated IRR", "format": "percent"},
            {
                "key": "profitability",
                "label": "Profitability index",
                "format": "multiple",
            },
            {"key": "payback", "label": "Simple payback period", "format": "years"},
        ],
        "formula_text": "NPV discounts each future cash flow and subtracts the initial investment.",
        "guide": "NPV depends heavily on the chosen discount rate. Use cash flows from consistent time periods and test multiple scenarios.",
    },
    {
        "slug": "target-margin-pricing-calculator",
        "endpoint": "advanced_tools.target_margin_pricing",
        "name": "Target Margin Pricing Calculator",
        "short_name": "Target Margin Pricing",
        "summary": "Set a list price that protects a target margin after a planned discount, then add tax for the final customer price.",
        "category": "Sales",
        "icon": "tag",
        "formula": "target_margin",
        "sensitivity_key": "cost",
        "sensitivity_label": "Unit cost",
        "inputs": [
            {
                "id": "cost",
                "label": "Unit cost",
                "value": 60,
                "min": 0,
                "step": 0.01,
                "kind": "money",
            },
            {
                "id": "target_margin",
                "label": "Target margin after discount",
                "value": 30,
                "min": 0,
                "max": 99.9,
                "step": 0.1,
                "kind": "percent",
            },
            {
                "id": "discount",
                "label": "Planned customer discount",
                "value": 10,
                "min": 0,
                "max": 99.9,
                "step": 0.1,
                "kind": "percent",
            },
            {
                "id": "tax",
                "label": "Tax or VAT added",
                "value": 15,
                "min": 0,
                "step": 0.1,
                "kind": "percent",
            },
        ],
        "results": [
            {
                "key": "list_price",
                "label": "Recommended list price",
                "format": "currency",
            },
            {
                "key": "sale_price",
                "label": "Price after discount",
                "format": "currency",
            },
            {
                "key": "customer_price",
                "label": "Customer price including tax",
                "format": "currency",
            },
            {"key": "profit", "label": "Profit per unit", "format": "currency"},
        ],
        "formula_text": "List price accounts for both the target post-discount margin and the planned discount.",
        "guide": "Confirm whether tax is included or added in your market and include all direct unit costs before setting the target margin.",
    },
]

ADVANCED_CALCULATOR_TOOLS_BY_SLUG = {
    tool["slug"]: tool for tool in ADVANCED_CALCULATOR_TOOLS
}


@bp.app_context_processor
def inject_advanced_calculator_tools() -> dict:
    return {"advanced_calculator_tools": ADVANCED_CALCULATOR_TOOLS}


def _render(slug: str):
    tool = ADVANCED_CALCULATOR_TOOLS_BY_SLUG[slug]
    related = [
        candidate
        for candidate in ADVANCED_CALCULATOR_TOOLS
        if candidate["slug"] != slug
    ]
    return render_template(
        "advanced-calculator.html",
        tool=tool,
        related_tools=related[:3],
        page_title=tool["name"],
        meta_description=tool["summary"],
    )


@bp.get("/tools/savings-goal-calculator/")
def savings_goal():
    return _render("savings-goal-calculator")


@bp.get("/tools/cagr-calculator/")
def cagr():
    return _render("cagr-calculator")


@bp.get("/tools/npv-irr-calculator/")
def npv_irr():
    return _render("npv-irr-calculator")


@bp.get("/tools/target-margin-pricing-calculator/")
def target_margin_pricing():
    return _render("target-margin-pricing-calculator")
