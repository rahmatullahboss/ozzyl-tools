from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path

from flask import (
    Blueprint,
    Response,
    abort,
    current_app,
    jsonify,
    render_template,
    send_from_directory,
    url_for,
)
from sqlalchemy import text

from .extensions import db
from .growth_tools import GROWTH_TOOLS
from .halal_catalog import CATEGORIES, DOCUMENT_TYPES, TOOLS, TOOLS_BY_SLUG
from .pdf_convert import PDF_CONVERT_TOOLS
from .pdf_lab import PDF_LAB_TOOLS
from .pdf_markup import PDF_MARKUP_TOOLS
from .pdf_tools import PDF_TOOLS
from .utility_tools import UTILITY_TOOLS

bp = Blueprint("main", __name__)
CONTENT_UPDATED = "2026-07-17"


def calculator_faq(tool: dict) -> list[dict[str, str]]:
    return [
        {
            "question": f"What does the {tool['name']} calculate?",
            "answer": tool["summary"],
        },
        {
            "question": f"How is the {tool['short_name']} result calculated?",
            "answer": f"{tool['formula_text']} The result updates when an input changes.",
        },
        {
            "question": f"Is the {tool['name']} free and private?",
            "answer": (
                "Yes. It is free without an account, and the values are calculated "
                "and saved locally in your browser."
            ),
        },
    ]


def document_faq(document: dict) -> list[dict[str, str]]:
    noun = document["noun"].lower()
    return [
        {
            "question": f"Can I create a {noun} without signing up?",
            "answer": f"Yes. The {document['name']} works without an account and saves the draft in your browser.",
        },
        {
            "question": f"Can I export the {noun} as a PDF?",
            "answer": "Yes. Use Print / PDF and choose your browser's Save as PDF option.",
        },
        {
            "question": f"Does the {noun} support currencies and tax rates?",
            "answer": "Yes. You can choose a currency, enter line-level tax, add discounts, and include transparent shipping or service fees.",
        },
    ]


@bp.app_context_processor
def inject_globals() -> dict:
    return {
        "site_name": current_app.config["SITE_NAME"],
        "site_url": current_app.config["SITE_URL"],
        "contact_email": current_app.config["CONTACT_EMAIL"],
        "current_year": datetime.now(UTC).year,
        "all_tools": TOOLS,
        "categories": CATEGORIES,
        "document_types": DOCUMENT_TYPES,
        "default_locale": current_app.config["DEFAULT_LOCALE"],
        "content_updated": CONTENT_UPDATED,
    }


@bp.get("/")
def home():
    home_faq = [
        {
            "question": "Are Ozzyl Tools free to use?",
            "answer": "Yes. Core calculators, utilities, PDF tools, and document generators are free and do not require an account.",
        },
        {
            "question": "Do Ozzyl Tools upload my data?",
            "answer": "Calculator values, document drafts, and supported file workflows are processed locally in your browser by default.",
        },
        {
            "question": "Does Ozzyl Tools include interest calculators?",
            "answer": "No. The public catalog excludes interest, usury, mortgage-interest, debt-interest, and compound-return calculators.",
        },
    ]
    return render_template(
        "home.html",
        page_title="Free Business Calculators, PDF Tools & Utilities",
        meta_description=(
            "Free, private and halal-friendly business calculators, PDF tools, utilities, and "
            "professional document generators. No sign-up required."
        ),
        home_faq=home_faq,
    )


@bp.get("/tools/<slug>/")
def calculator(slug: str):
    tool = TOOLS_BY_SLUG.get(slug)
    if not tool:
        abort(404)
    related = [
        candidate
        for candidate in TOOLS
        if candidate["slug"] != slug and candidate["category"] == tool["category"]
    ][:3]
    if len(related) < 3:
        related.extend(
            candidate
            for candidate in TOOLS
            if candidate["slug"] != slug and candidate not in related
        )
    return render_template(
        "calculator.html",
        tool=tool,
        related_tools=related[:3],
        faq_items=calculator_faq(tool),
        page_title=tool["name"],
        meta_description=tool["summary"],
    )


@bp.get("/documents/<document_type>-generator/")
def document_generator(document_type: str):
    config = DOCUMENT_TYPES.get(document_type)
    if not config:
        abort(404)
    return render_template(
        "document.html",
        document_type=document_type,
        document=config,
        faq_items=document_faq(config),
        page_title=config["name"],
        meta_description=config["summary"],
    )


@bp.get("/invoice-generator/")
def invoice_alias():
    return document_generator("invoice")


@bp.get("/quotation-generator/")
def quotation_alias():
    return document_generator("quotation")


@bp.get("/about/")
def about():
    return render_template(
        "about.html",
        page_title="About Ozzyl Tools",
        meta_description=(
            "Learn how Ozzyl Tools builds free, privacy-first and halal-friendly online tools "
            "for practical business, PDF, data, and writing tasks."
        ),
    )


@bp.get("/privacy/")
def privacy():
    return render_template(
        "legal.html",
        page_title="Privacy Policy",
        heading="Privacy Policy",
        sections=[
            (
                "Local-first tools",
                "Calculator inputs, files, and document drafts are processed and saved in your browser by default. They are not sent to our server unless a future cloud feature clearly asks you to sign in and save them.",
            ),
            (
                "Technical data",
                "Standard server logs may include IP address, browser type, requested page, and timestamp for security and reliability.",
            ),
            (
                "Future analytics",
                "Privacy-conscious analytics will only be added with updated disclosure and any consent controls required by law.",
            ),
            (
                "Your choices",
                "You can clear saved drafts, recent tools, favorites, and theme preferences from your browser storage at any time.",
            ),
        ],
        meta_description="How Ozzyl Tools handles calculator inputs, local drafts, files, and technical data.",
    )


@bp.get("/terms/")
def terms():
    return render_template(
        "legal.html",
        page_title="Terms of Use",
        heading="Terms of Use",
        sections=[
            (
                "Calculation aids",
                "The tools provide estimates for general informational purposes. Verify important financial, tax, payroll, legal, and business decisions with a qualified professional.",
            ),
            (
                "Your responsibility",
                "You are responsible for reviewing generated documents, rates, totals, taxes, and terms before sending or relying on them.",
            ),
            (
                "Availability",
                "We may improve, replace, or discontinue tools. We do not guarantee uninterrupted availability or suitability for a specific purpose.",
            ),
        ],
        meta_description="Terms for using Ozzyl Tools calculators, utilities, PDF tools, and document generators.",
    )


@bp.get("/sitemap.xml")
def sitemap():
    urls = [url_for("main.home", _external=True)]
    urls.extend(url_for("main.calculator", slug=tool["slug"], _external=True) for tool in TOOLS)
    urls.extend(url_for(tool["endpoint"], _external=True) for tool in GROWTH_TOOLS)
    urls.extend(url_for(tool["endpoint"], _external=True) for tool in UTILITY_TOOLS)
    urls.extend(url_for(tool["endpoint"], _external=True) for tool in PDF_TOOLS)
    urls.extend(url_for(tool["endpoint"], _external=True) for tool in PDF_LAB_TOOLS)
    urls.extend(url_for(tool["endpoint"], _external=True) for tool in PDF_CONVERT_TOOLS)
    urls.extend(url_for(tool["endpoint"], _external=True) for tool in PDF_MARKUP_TOOLS)
    urls.append(url_for("word_tools.word_unscrambler", _external=True))
    urls.extend(
        url_for("main.document_generator", document_type=kind, _external=True)
        for kind in DOCUMENT_TYPES
    )
    urls.extend(
        [
            url_for("main.about", _external=True),
            url_for("main.privacy", _external=True),
            url_for("main.terms", _external=True),
        ]
    )
    body = render_template("sitemap.xml", urls=urls, lastmod=CONTENT_UPDATED)
    return Response(body, mimetype="application/xml")


@bp.get("/robots.txt")
def robots():
    sitemap_url = url_for("main.sitemap", _external=True)
    body = (
        "User-agent: *\nAllow: /\n\n"
        "User-agent: GPTBot\nAllow: /\n\n"
        "User-agent: ChatGPT-User\nAllow: /\n\n"
        "User-agent: ClaudeBot\nAllow: /\n\n"
        "User-agent: PerplexityBot\nAllow: /\n\n"
        "User-agent: Google-Extended\nAllow: /\n\n"
        f"Sitemap: {sitemap_url}\n"
    )
    return Response(body, mimetype="text/plain")


@bp.get("/llms.txt")
def llms_txt():
    lines = [
        "# Ozzyl Tools",
        "",
        "> Free, privacy-first and halal-friendly online tools for business, PDF, data, and writing tasks.",
        "",
        "## Core pages",
        f"- [Home]({url_for('main.home', _external=True)}): Browse the public tool directory.",
        f"- [About]({url_for('main.about', _external=True)}): Product principles, privacy model, and content standards.",
        f"- [Word Unscrambler]({url_for('word_tools.word_unscrambler', _external=True)}): Find anagrams and shorter English words.",
        "",
        "## Business calculators",
    ]
    lines.extend(
        f"- [{tool['name']}]({url_for('main.calculator', slug=tool['slug'], _external=True)}): {tool['summary']}"
        for tool in TOOLS
    )
    lines.extend(["", "## Business growth calculators"])
    lines.extend(
        f"- [{tool['name']}]({url_for(tool['endpoint'], _external=True)}): {tool['summary']}"
        for tool in GROWTH_TOOLS
    )
    lines.extend(["", "## Utilities"])
    lines.extend(
        f"- [{tool['name']}]({url_for(tool['endpoint'], _external=True)}): {tool['summary']}"
        for tool in UTILITY_TOOLS
    )
    lines.extend(["", "## Document generators"])
    lines.extend(
        f"- [{document['name']}]({url_for('main.document_generator', document_type=kind, _external=True)}): {document['summary']}"
        for kind, document in DOCUMENT_TYPES.items()
    )
    lines.extend(
        [
            "",
            "## Usage notes",
            "- Core tools are free and do not require an account.",
            "- Inputs, drafts, and supported files stay in the browser by default.",
            "- The public catalog excludes interest, usury, mortgage-interest, debt-interest, and compound-return calculators.",
            f"- Content last reviewed: {CONTENT_UPDATED}.",
        ]
    )
    return Response("\n".join(lines) + "\n", mimetype="text/plain")


@bp.get("/manifest.webmanifest")
def manifest():
    return jsonify(
        {
            "name": current_app.config["SITE_NAME"],
            "short_name": "Ozzyl Tools",
            "description": "Private, fast and halal-friendly online tools.",
            "start_url": "/",
            "display": "standalone",
            "background_color": "#f8fafc",
            "theme_color": "#2563eb",
            "icons": [
                {
                    "src": url_for("static", filename="img/app-icon.svg"),
                    "sizes": "any",
                    "type": "image/svg+xml",
                    "purpose": "any maskable",
                }
            ],
        }
    )


@bp.get("/service-worker.js")
def service_worker():
    static_root = Path(current_app.root_path) / "static" / "js"
    response = send_from_directory(
        static_root, "service-worker.js", mimetype="application/javascript"
    )
    response.headers["Service-Worker-Allowed"] = "/"
    response.headers["Cache-Control"] = "no-cache"
    return response


@bp.get("/offline/")
def offline():
    return render_template(
        "offline.html",
        page_title="You are offline",
        meta_description="Offline fallback for Ozzyl Tools.",
        noindex=True,
    )


@bp.get("/health/")
def health():
    return jsonify({"status": "ok", "service": "ozzyl-tools"})


@bp.get("/ready/")
def ready():
    try:
        db.session.execute(text("SELECT 1"))
    except Exception:
        current_app.logger.exception("Database readiness check failed")
        return jsonify({"status": "not-ready", "database": "unavailable"}), 503
    return jsonify({"status": "ready", "database": "available"})
