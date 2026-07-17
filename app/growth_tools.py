from __future__ import annotations

from flask import Blueprint, render_template

bp = Blueprint("growth_tools", __name__)


def _input(
    key: str,
    label: str,
    value: float,
    kind: str,
    *,
    minimum: float = 0,
    maximum: float | None = None,
    step: float = 0.01,
) -> dict:
    config = {
        "id": key,
        "label": label,
        "value": value,
        "min": minimum,
        "step": step,
        "kind": kind,
    }
    if maximum is not None:
        config["max"] = maximum
    return config


def _result(key: str, label: str, format_name: str) -> dict:
    return {"key": key, "label": label, "format": format_name}


GROWTH_TOOLS = [
    {
        "slug": "investment-return-analyzer",
        "endpoint": "growth_tools.investment_return",
        "name": "Investment Return Analyzer",
        "short_name": "Investment Return Analyzer",
        "summary": (
            "Measure return on investment, net profit, annualized ROI, and the break-even "
            "return required to recover the investment."
        ),
        "category": "Growth",
        "icon": "trending-up",
        "formula": "roi",
        "sensitivity_key": "return_value",
        "sensitivity_label": "Total return value",
        "inputs": [
            _input("investment", "Total investment", 10000, "money"),
            _input("return_value", "Total value returned", 13000, "money"),
            _input("months", "Investment duration", 12, "months", minimum=0.01, step=1),
        ],
        "results": [
            _result("roi", "Return on investment", "percent"),
            _result("net_profit", "Net profit", "currency"),
            _result("annualized_roi", "Annualized ROI", "percent"),
            _result("break_even_return", "Break-even return", "currency"),
        ],
        "formula_text": "ROI = (total value returned − investment) ÷ investment × 100.",
        "guide": (
            "Include all acquisition, setup, financing, operating, and exit costs when they "
            "are material to the decision."
        ),
    },
    {
        "slug": "roas-calculator",
        "endpoint": "growth_tools.roas",
        "name": "ROAS Calculator",
        "short_name": "ROAS",
        "summary": (
            "Calculate advertising return, margin-aware contribution profit, break-even ROAS, "
            "and revenue required for a target profit."
        ),
        "category": "Marketing",
        "icon": "target",
        "formula": "roas",
        "sensitivity_key": "revenue",
        "sensitivity_label": "Revenue attributed to ads",
        "inputs": [
            _input("ad_spend", "Advertising spend", 5000, "money"),
            _input("revenue", "Revenue attributed to ads", 20000, "money"),
            _input("gross_margin", "Gross margin", 40, "percent", maximum=100, step=0.1),
            _input("target_profit", "Target contribution profit", 2000, "money"),
        ],
        "results": [
            _result("roas", "Return on ad spend", "multiple"),
            _result("contribution_profit", "Contribution after ad spend", "currency"),
            _result("break_even_roas", "Break-even ROAS", "multiple"),
            _result("required_revenue", "Revenue needed for target profit", "currency"),
        ],
        "formula_text": "ROAS = attributed revenue ÷ advertising spend.",
        "guide": (
            "Use contribution margin rather than revenue alone when judging whether a campaign "
            "actually creates profit."
        ),
    },
    {
        "slug": "customer-lifetime-value-calculator",
        "endpoint": "growth_tools.customer_lifetime_value",
        "name": "Customer Lifetime Value Calculator",
        "short_name": "Customer Lifetime Value",
        "summary": (
            "Estimate gross and net customer lifetime value, CLV-to-CAC ratio, and the number of "
            "orders needed to recover acquisition cost."
        ),
        "category": "Customers",
        "icon": "users",
        "formula": "clv",
        "sensitivity_key": "purchases_per_year",
        "sensitivity_label": "Purchases per customer per year",
        "inputs": [
            _input("average_order_value", "Average order value", 80, "money"),
            _input(
                "purchases_per_year",
                "Purchases per customer per year",
                6,
                "number",
                step=0.1,
            ),
            _input("gross_margin", "Gross margin", 45, "percent", maximum=100, step=0.1),
            _input("lifespan_years", "Average customer lifespan", 3, "years", step=0.25),
            _input("acquisition_cost", "Customer acquisition cost", 120, "money"),
        ],
        "results": [
            _result("net_clv", "Net customer lifetime value", "currency"),
            _result("gross_clv", "Gross contribution lifetime value", "currency"),
            _result("clv_cac_ratio", "CLV-to-CAC ratio", "multiple"),
            _result("payback_orders", "Orders to recover acquisition cost", "number"),
        ],
        "formula_text": (
            "Gross CLV = average order value × purchase frequency × gross margin × lifespan."
        ),
        "guide": (
            "Use cohort-based retention, order frequency, margin, and acquisition cost when "
            "available instead of relying only on company-wide averages."
        ),
    },
    {
        "slug": "inventory-reorder-point-calculator",
        "endpoint": "growth_tools.inventory_reorder_point",
        "name": "Inventory Reorder Point Calculator",
        "short_name": "Inventory Reorder Point",
        "summary": (
            "Calculate when to reorder inventory using daily demand, supplier lead time, and "
            "safety stock, then review order value and annual order frequency."
        ),
        "category": "Operations",
        "icon": "boxes",
        "formula": "reorder_point",
        "sensitivity_key": "daily_demand",
        "sensitivity_label": "Average daily demand",
        "inputs": [
            _input("daily_demand", "Average units sold per day", 12, "units"),
            _input("lead_time_days", "Supplier lead time", 10, "days", step=0.1),
            _input("safety_stock", "Safety stock", 40, "units"),
            _input("order_quantity", "Planned order quantity", 300, "units"),
            _input("unit_cost", "Cost per unit", 15, "money"),
        ],
        "results": [
            _result("reorder_point", "Reorder point", "units"),
            _result("days_of_cover", "Stock cover at reorder", "days"),
            _result("order_value", "Planned order value", "currency"),
            _result("annual_orders", "Estimated orders per year", "number"),
        ],
        "formula_text": "Reorder point = average daily demand × lead time + safety stock.",
        "guide": (
            "Update demand, lead time, and safety stock for seasonality, supplier variability, "
            "promotions, and service-level targets."
        ),
    },
]

GROWTH_TOOLS_BY_SLUG = {tool["slug"]: tool for tool in GROWTH_TOOLS}


@bp.app_context_processor
def inject_growth_tools() -> dict:
    return {"growth_tools": GROWTH_TOOLS}


def _render(slug: str):
    tool = GROWTH_TOOLS_BY_SLUG[slug]
    related = [candidate for candidate in GROWTH_TOOLS if candidate["slug"] != slug]
    return render_template(
        "growth-tool.html",
        tool=tool,
        related_tools=related[:3],
        page_title=tool["name"],
        meta_description=tool["summary"],
    )


@bp.get("/tools/investment-return-analyzer/")
def investment_return():
    return _render("investment-return-analyzer")


@bp.get("/tools/roas-calculator/")
def roas():
    return _render("roas-calculator")


@bp.get("/tools/customer-lifetime-value-calculator/")
def customer_lifetime_value():
    return _render("customer-lifetime-value-calculator")


@bp.get("/tools/inventory-reorder-point-calculator/")
def inventory_reorder_point():
    return _render("inventory-reorder-point-calculator")
