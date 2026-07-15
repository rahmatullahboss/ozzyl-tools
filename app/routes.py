from __future__ import annotations

from datetime import date

from flask import Blueprint, Response, abort, current_app, render_template, url_for

from .catalog import TOOLS, TOOLS_BY_SLUG

bp = Blueprint("main", __name__)


@bp.app_context_processor
def inject_globals():
    return {
        "site_name": current_app.config["SITE_NAME"],
        "site_url": current_app.config["SITE_URL"],
        "current_year": date.today().year,
        "all_tools": TOOLS,
    }


@bp.get("/")
def home():
    return render_template(
        "home.html",
        page_title="Free Business Calculators & Workflow Tools",
        meta_description=(
            "Free, fast business calculators for profit margin, markup, commission, VAT, "
            "break-even, loans, overtime, invoices, and quotations."
        ),
    )


@bp.get("/tools/<slug>/")
def calculator(slug: str):
    tool = TOOLS_BY_SLUG.get(slug)
    if not tool:
        abort(404)
    return render_template(
        "calculator.html",
        tool=tool,
        page_title=tool["name"],
        meta_description=tool["summary"],
    )


@bp.get("/invoice-generator/")
def invoice_generator():
    return render_template(
        "invoice.html",
        document_type="Invoice",
        page_title="Free Invoice Generator",
        meta_description="Create, save, print, and export a professional invoice directly in your browser.",
    )


@bp.get("/quotation-generator/")
def quotation_generator():
    return render_template(
        "invoice.html",
        document_type="Quotation",
        page_title="Free Quotation Generator",
        meta_description="Create and export a professional business quotation without creating an account.",
    )


@bp.get("/privacy/")
def privacy():
    return render_template(
        "legal.html",
        heading="Privacy",
        page_title="Privacy Policy",
        meta_description="Privacy information for Ozzyl Tools.",
        paragraphs=[
            "The current calculators run in your browser. Values entered into calculators are not submitted to our server.",
            "Invoice and quotation drafts are stored in your browser using local storage when you choose to save them.",
            "Future analytics, advertising, accounts, or cloud storage will be disclosed here before they are enabled.",
        ],
    )


@bp.get("/terms/")
def terms():
    return render_template(
        "legal.html",
        heading="Terms of Use",
        page_title="Terms of Use",
        meta_description="Terms for using Ozzyl Tools.",
        paragraphs=[
            "These tools provide general estimates and productivity assistance. They are not legal, tax, accounting, lending, or employment advice.",
            "You are responsible for reviewing calculations and confirming rules that apply to your business and jurisdiction.",
            "The service is provided as-is without a guarantee that every result will fit every use case.",
        ],
    )


@bp.get("/health/")
def health():
    return {"status": "ok", "service": current_app.config["SITE_NAME"]}


@bp.get("/robots.txt")
def robots():
    sitemap = f"{current_app.config['SITE_URL']}{url_for('main.sitemap')}"
    return Response(f"User-agent: *\nAllow: /\nSitemap: {sitemap}\n", mimetype="text/plain")


@bp.get("/sitemap.xml")
def sitemap():
    pages = [
        url_for("main.home", _external=True),
        url_for("main.invoice_generator", _external=True),
        url_for("main.quotation_generator", _external=True),
        url_for("main.privacy", _external=True),
        url_for("main.terms", _external=True),
    ]
    pages.extend(url_for("main.calculator", slug=tool["slug"], _external=True) for tool in TOOLS)
    xml = render_template("sitemap.xml", pages=pages)
    return Response(xml, mimetype="application/xml")


@bp.app_errorhandler(404)
def not_found(_error):
    return (
        render_template(
            "legal.html",
            heading="Page not found",
            page_title="Page not found",
            meta_description="The requested page could not be found.",
            paragraphs=["The page may have moved. Return to the homepage to browse all available business tools."],
        ),
        404,
    )
