from __future__ import annotations

from flask import Blueprint, render_template

bp = Blueprint("finance_tools", __name__)

FINANCE_TOOLS = [
    {
        "slug": "debt-to-income-calculator",
        "endpoint": "finance_tools.debt_to_income",
        "name": "Debt-to-Income Ratio Calculator",
        "short_name": "Debt-to-Income Ratio",
        "summary": "Calculate front-end and back-end DTI, then estimate remaining monthly debt capacity at a target ratio.",
        "category": "Borrowing",
        "icon": "percent",
        "formula": "dti",
        "sensitivity_key": "gross_income",
        "sensitivity_label": "Gross monthly income",
        "inputs": [
            {
                "id": "gross_income",
                "label": "Gross monthly income",
                "value": 6000,
                "min": 0,
                "step": 0.01,
                "kind": "money",
            },
            {
                "id": "housing",
                "label": "Monthly housing payment",
                "value": 1500,
                "min": 0,
                "step": 0.01,
                "kind": "money",
            },
            {
                "id": "other_debt",
                "label": "Other monthly debt payments",
                "value": 500,
                "min": 0,
                "step": 0.01,
                "kind": "money",
            },
            {
                "id": "target_dti",
                "label": "Target total DTI",
                "value": 36,
                "min": 0,
                "max": 100,
                "step": 0.1,
                "kind": "percent",
            },
        ],
        "results": [
            {
                "key": "back_end",
                "label": "Total debt-to-income ratio",
                "format": "percent",
            },
            {"key": "front_end", "label": "Housing-only ratio", "format": "percent"},
            {
                "key": "total_debt",
                "label": "Current monthly debt",
                "format": "currency",
            },
            {
                "key": "remaining_capacity",
                "label": "Remaining debt capacity",
                "format": "currency",
            },
        ],
        "formula_text": "Total DTI = all monthly debt payments ÷ gross monthly income × 100.",
        "guide": "Different lenders and loan products use different limits. Treat the target ratio as a planning assumption, not an approval promise.",
    },
    {
        "slug": "loan-to-value-calculator",
        "endpoint": "finance_tools.loan_to_value",
        "name": "Loan-to-Value Ratio Calculator",
        "short_name": "Loan-to-Value Ratio",
        "summary": "Measure combined loan-to-value, available equity, and additional borrowing room at a selected target LTV.",
        "category": "Borrowing",
        "icon": "bank",
        "formula": "ltv",
        "sensitivity_key": "property_value",
        "sensitivity_label": "Property value",
        "inputs": [
            {
                "id": "property_value",
                "label": "Current property value",
                "value": 300000,
                "min": 0.01,
                "step": 0.01,
                "kind": "money",
            },
            {
                "id": "primary_loan",
                "label": "Primary loan balance",
                "value": 210000,
                "min": 0,
                "step": 0.01,
                "kind": "money",
            },
            {
                "id": "secondary_loan",
                "label": "Second loan or secured balance",
                "value": 0,
                "min": 0,
                "step": 0.01,
                "kind": "money",
            },
            {
                "id": "target_ltv",
                "label": "Target combined LTV",
                "value": 80,
                "min": 0,
                "max": 100,
                "step": 0.1,
                "kind": "percent",
            },
        ],
        "results": [
            {"key": "ltv", "label": "Combined loan-to-value", "format": "percent"},
            {
                "key": "equity",
                "label": "Estimated property equity",
                "format": "currency",
            },
            {
                "key": "total_loan",
                "label": "Total secured balance",
                "format": "currency",
            },
            {
                "key": "additional_capacity",
                "label": "Additional room at target LTV",
                "format": "currency",
            },
        ],
        "formula_text": "Combined LTV = total secured loan balances ÷ property value × 100.",
        "guide": "Property valuations, lien priority, fees, credit policy, and local lending rules can materially change available borrowing.",
    },
    {
        "slug": "mortgage-affordability-calculator",
        "endpoint": "finance_tools.mortgage_affordability",
        "name": "Mortgage Affordability Calculator",
        "short_name": "Mortgage Affordability",
        "summary": "Estimate an affordable home price from income, existing debts, rate, term, down payment, taxes, insurance, and target DTI.",
        "category": "Housing",
        "icon": "bank",
        "formula": "mortgage_affordability",
        "sensitivity_key": "annual_rate",
        "sensitivity_label": "Mortgage interest rate",
        "inputs": [
            {
                "id": "gross_income",
                "label": "Gross monthly income",
                "value": 8000,
                "min": 0,
                "step": 0.01,
                "kind": "money",
            },
            {
                "id": "monthly_debt",
                "label": "Existing monthly debt payments",
                "value": 750,
                "min": 0,
                "step": 0.01,
                "kind": "money",
            },
            {
                "id": "annual_rate",
                "label": "Annual mortgage rate",
                "value": 7,
                "min": 0,
                "step": 0.01,
                "kind": "percent",
            },
            {
                "id": "years",
                "label": "Mortgage term",
                "value": 30,
                "min": 1,
                "max": 50,
                "step": 1,
                "kind": "years",
            },
            {
                "id": "down_payment",
                "label": "Available down payment",
                "value": 50000,
                "min": 0,
                "step": 0.01,
                "kind": "money",
            },
            {
                "id": "monthly_tax_insurance",
                "label": "Monthly taxes, insurance and fees",
                "value": 550,
                "min": 0,
                "step": 0.01,
                "kind": "money",
            },
            {
                "id": "target_dti",
                "label": "Target total DTI",
                "value": 36,
                "min": 0,
                "max": 100,
                "step": 0.1,
                "kind": "percent",
            },
        ],
        "results": [
            {
                "key": "home_price",
                "label": "Estimated affordable home price",
                "format": "currency",
            },
            {
                "key": "loan_amount",
                "label": "Estimated mortgage amount",
                "format": "currency",
            },
            {
                "key": "housing_budget",
                "label": "Maximum monthly housing budget",
                "format": "currency",
            },
            {
                "key": "principal_interest",
                "label": "Available principal and interest",
                "format": "currency",
            },
        ],
        "formula_text": "The model converts the housing payment remaining under the selected total DTI into a mortgage principal, then adds the down payment.",
        "guide": "Closing costs, maintenance, mortgage insurance, changing rates, lender policy, and emergency savings are not fully captured by one affordability estimate.",
    },
    {
        "slug": "debt-payoff-calculator",
        "endpoint": "finance_tools.debt_payoff",
        "name": "Debt Payoff Calculator",
        "short_name": "Debt Payoff",
        "summary": "Estimate payoff time, total interest, and savings from an extra monthly payment using a complete declining-balance schedule.",
        "category": "Debt",
        "icon": "calendar",
        "formula": "debt_payoff",
        "sensitivity_key": "monthly_payment",
        "sensitivity_label": "Scheduled monthly payment",
        "inputs": [
            {
                "id": "balance",
                "label": "Current debt balance",
                "value": 15000,
                "min": 0,
                "step": 0.01,
                "kind": "money",
            },
            {
                "id": "annual_rate",
                "label": "Annual interest rate",
                "value": 18,
                "min": 0,
                "step": 0.01,
                "kind": "percent",
            },
            {
                "id": "monthly_payment",
                "label": "Scheduled monthly payment",
                "value": 450,
                "min": 0.01,
                "step": 0.01,
                "kind": "money",
            },
            {
                "id": "extra_payment",
                "label": "Extra monthly payment",
                "value": 100,
                "min": 0,
                "step": 0.01,
                "kind": "money",
            },
        ],
        "results": [
            {"key": "months", "label": "Estimated payoff time", "format": "months"},
            {"key": "total_interest", "label": "Total interest", "format": "currency"},
            {"key": "total_paid", "label": "Total amount paid", "format": "currency"},
            {
                "key": "months_saved",
                "label": "Months saved with extra payment",
                "format": "months",
            },
        ],
        "formula_text": "Each month applies interest to the remaining balance, then uses the payment to reduce principal.",
        "guide": "Confirm whether your lender compounds differently, charges prepayment fees, or applies extra payments automatically to principal.",
    },
]

FINANCE_TOOLS_BY_SLUG = {tool["slug"]: tool for tool in FINANCE_TOOLS}


@bp.app_context_processor
def inject_finance_tools() -> dict:
    return {"finance_tools": FINANCE_TOOLS}


def _render(slug: str):
    tool = FINANCE_TOOLS_BY_SLUG[slug]
    related = [candidate for candidate in FINANCE_TOOLS if candidate["slug"] != slug]
    return render_template(
        "finance-tool.html",
        tool=tool,
        related_tools=related[:3],
        page_title=tool["name"],
        meta_description=tool["summary"],
    )


@bp.get("/tools/debt-to-income-calculator/")
def debt_to_income():
    return _render("debt-to-income-calculator")


@bp.get("/tools/loan-to-value-calculator/")
def loan_to_value():
    return _render("loan-to-value-calculator")


@bp.get("/tools/mortgage-affordability-calculator/")
def mortgage_affordability():
    return _render("mortgage-affordability-calculator")


@bp.get("/tools/debt-payoff-calculator/")
def debt_payoff():
    return _render("debt-payoff-calculator")
