from __future__ import annotations

from flask import Blueprint, render_template

from .data_tools import DATA_TOOLS, DATA_TOOLS_BY_SLUG

bp = Blueprint("utility_tools", __name__)

CORE_UTILITY_TOOLS = [
    {
        "slug": "word-counter",
        "endpoint": "utility_tools.word_counter",
        "name": "Word Counter",
        "short_name": "Word Counter",
        "summary": (
            "Count words, characters, sentences, paragraphs, and estimated reading time instantly."
        ),
        "category": "Writing",
        "icon": "file-text",
        "kind": "word_counter",
    },
    {
        "slug": "case-converter",
        "endpoint": "utility_tools.case_converter",
        "name": "Case Converter",
        "short_name": "Case Converter",
        "summary": (
            "Convert text to uppercase, lowercase, title case, or sentence case in one click."
        ),
        "category": "Writing",
        "icon": "letters",
        "kind": "case_converter",
    },
    {
        "slug": "percentage-calculator",
        "endpoint": "utility_tools.percentage_calculator",
        "name": "Percentage Calculator",
        "short_name": "Percentage Calculator",
        "summary": "Calculate percentages, ratios, and percentage increases or decreases.",
        "category": "Math",
        "icon": "percent",
        "kind": "percentage",
    },
    {
        "slug": "password-generator",
        "endpoint": "utility_tools.password_generator",
        "name": "Password Generator",
        "short_name": "Password Generator",
        "summary": "Generate strong, customizable passwords securely in your browser.",
        "category": "Security",
        "icon": "lock",
        "kind": "password",
    },
]

UTILITY_TOOLS = [*CORE_UTILITY_TOOLS, *DATA_TOOLS]
UTILITY_TOOLS_BY_SLUG = {tool["slug"]: tool for tool in UTILITY_TOOLS}


@bp.app_context_processor
def inject_utility_tools() -> dict:
    return {"utility_tools": UTILITY_TOOLS}


def _render_utility(slug: str):
    tool = UTILITY_TOOLS_BY_SLUG[slug]
    related_tools = [
        candidate for candidate in CORE_UTILITY_TOOLS if candidate["slug"] != slug
    ][:3]
    return render_template(
        "utility-tool.html",
        tool=tool,
        related_tools=related_tools,
        page_title=tool["name"],
        meta_description=tool["summary"],
    )


def _render_data_utility(slug: str):
    tool = DATA_TOOLS_BY_SLUG[slug]
    related_tools = [candidate for candidate in DATA_TOOLS if candidate["slug"] != slug][:3]
    return render_template(
        "data-tool.html",
        tool=tool,
        related_tools=related_tools,
        page_title=tool["name"],
        meta_description=tool["summary"],
    )


@bp.get("/tools/word-counter/")
def word_counter():
    return _render_utility("word-counter")


@bp.get("/tools/case-converter/")
def case_converter():
    return _render_utility("case-converter")


@bp.get("/tools/percentage-calculator/")
def percentage_calculator():
    return _render_utility("percentage-calculator")


@bp.get("/tools/password-generator/")
def password_generator():
    return _render_utility("password-generator")


@bp.get("/tools/utm-campaign-url-builder/")
def utm_builder():
    return _render_data_utility("utm-campaign-url-builder")


@bp.get("/tools/qr-code-generator/")
def qr_code_generator():
    return _render_data_utility("qr-code-generator")


@bp.get("/tools/json-formatter-validator/")
def json_formatter():
    return _render_data_utility("json-formatter-validator")


@bp.get("/tools/csv-json-converter/")
def csv_json_converter():
    return _render_data_utility("csv-json-converter")


@bp.get("/tools/base64-encoder-decoder/")
def base64_tool():
    return _render_data_utility("base64-encoder-decoder")


@bp.get("/tools/uuid-generator/")
def uuid_generator():
    return _render_data_utility("uuid-generator")


@bp.get("/tools/unix-timestamp-converter/")
def timestamp_converter():
    return _render_data_utility("unix-timestamp-converter")


@bp.get("/tools/regex-tester/")
def regex_tester():
    return _render_data_utility("regex-tester")
