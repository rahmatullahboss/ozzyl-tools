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

from .advanced_tools import ADVANCED_CALCULATOR_TOOLS
from .catalog import CATEGORIES, DOCUMENT_TYPES, TOOLS, TOOLS_BY_SLUG
from .extensions import db
from .finance_tools import FINANCE_TOOLS
from .pdf_convert import PDF_CONVERT_TOOLS
from .pdf_lab import PDF_LAB_TOOLS
from .pdf_tools import PDF_TOOLS
from .utility_tools import UTILITY_TOOLS

bp = Blueprint("main", __name__)


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
    }


@bp.get("/")
def home():
    return render_template(
        "home.html",
        page_title="Free Business Calculators & Workflow Tools",
        meta_description=(
            "Fast, private business calculators, advanced financial analysis, PDF tools, and "
            "professional document generators. No sign-up required."
        ),
    )


@bp.get("/tools/<slug>/")
def calculator(slug: str):
    tool = TOOLS_BY_SLUG.get(slug)
    if not tool:
        abort(404)
    related = [candidate for candidate in TOOLS if candidate["slug"] != slug and candidate["category"] == tool["category"]][:3]
    if len(related) < 3:
        related.extend(candidate for candidate in TOOLS if candidate["slug"] != slug and candidate not in related)
    return render_template("calculator.html", tool=tool, related_tools=related[:3], page_title=tool["name"], meta_description=tool["summary"])


@bp.get("/documents/<document_type>-generator/")
def document_generator(document_type: str):
    config = DOCUMENT_TYPES.get(document_type)
    if not config:
        abort(404)
    return render_template("document.html", document_type=document_type, document=config, page_title=config["name"], meta_description=config["summary"])


@bp.get("/invoice-generator/")
def invoice_alias():
    return document_generator("invoice")


@bp.get("/quotation-generator/")
def quotation_alias():
    return document_generator("quotation")


@bp.get("/privacy/")
def privacy():
    return render_template(
        "legal.html",
        page_title="Privacy Policy",
        heading="Privacy Policy",
        sections=[
            ("Local-first tools", "Calculator inputs and document drafts are processed and saved in your browser by default. They are not sent to our server unless a future cloud feature clearly asks you to sign in and save them."),
            ("Technical data", "Standard server logs may include IP address, browser type, requested page, and timestamp for security and reliability."),
            ("Future analytics and advertising", "Analytics, advertising, or affiliate services will only be added with updated disclosure and any consent controls required by law."),
            ("Your choices", "You can clear saved drafts, recent tools, favorites, and theme preferences from your browser storage at any time."),
        ],
        meta_description="How Ozzyl Tools handles calculator inputs, local drafts, and technical data.",
    )


@bp.get("/terms/")
def terms():
    return render_template(
        "legal.html",
        page_title="Terms of Use",
        heading="Terms of Use",
        sections=[
            ("Calculation aids", "The tools provide estimates for general informational purposes. Verify important financial, tax, payroll, legal, and business decisions with a qualified professional."),
            ("Your responsibility", "You are responsible for reviewing generated documents, rates, totals, taxes, and terms before sending or relying on them."),
            ("Availability", "We may improve, replace, or discontinue tools. We do not guarantee uninterrupted availability or suitability for a specific purpose."),
        ],
        meta_description="Terms for using Ozzyl Tools calculators and document generators.",
    )


@bp.get("/sitemap.xml")
def sitemap():
    urls = [url_for("main.home", _external=True)]
    urls.extend(url_for("main.calculator", slug=tool["slug"], _external=True) for tool in TOOLS)
    urls.extend(url_for(tool["endpoint"], _external=True) for tool in ADVANCED_CALCULATOR_TOOLS)
    urls.extend(url_for(tool["endpoint"], _external=True) for tool in FINANCE_TOOLS)
    urls.extend(url_for(tool["endpoint"], _external=True) for tool in UTILITY_TOOLS)
    urls.extend(url_for(tool["endpoint"], _external=True) for tool in PDF_TOOLS)
    urls.extend(url_for(tool["endpoint"], _external=True) for tool in PDF_LAB_TOOLS)
    urls.extend(url_for(tool["endpoint"], _external=True) for tool in PDF_CONVERT_TOOLS)
    urls.append(url_for("word_tools.word_unscrambler", _external=True))
    urls.extend(url_for("main.document_generator", document_type=kind, _external=True) for kind in DOCUMENT_TYPES)
    urls.extend([url_for("main.privacy", _external=True), url_for("main.terms", _external=True)])
    body = render_template("sitemap.xml", urls=urls)
    return Response(body, mimetype="application/xml")


@bp.get("/robots.txt")
def robots():
    body = f"User-agent: *\nAllow: /\nSitemap: {url_for('main.sitemap', _external=True)}\n"
    return Response(body, mimetype="text/plain")


@bp.get("/manifest.webmanifest")
def manifest():
    return jsonify({"name": current_app.config["SITE_NAME"], "short_name": "Ozzyl Tools", "description": "Private, fast business calculators and document generators.", "start_url": "/", "display": "standalone", "background_color": "#f8fafc", "theme_color": "#2563eb", "icons": [{"src": url_for("static", filename="img/app-icon.svg"), "sizes": "any", "type": "image/svg+xml", "purpose": "any maskable"}]})


@bp.get("/service-worker.js")
def service_worker():
    static_root = Path(current_app.root_path) / "static" / "js"
    response = send_from_directory(static_root, "service-worker.js", mimetype="application/javascript")
    response.headers["Service-Worker-Allowed"] = "/"
    response.headers["Cache-Control"] = "no-cache"
    return response


@bp.get("/offline/")
def offline():
    return render_template("offline.html", page_title="You are offline", meta_description="Offline fallback for Ozzyl Tools.", noindex=True)


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
