from __future__ import annotations

from flask import Blueprint, render_template

bp = Blueprint("pdf_markup", __name__)

PDF_MARKUP_TOOLS = [
    {
        "slug": "sign-pdf",
        "endpoint": "pdf_markup.sign_pdf",
        "name": "Sign PDF",
        "short_name": "Sign PDF",
        "summary": (
            "Type, draw, or upload a signature and place it on a selected PDF page without "
            "sending the document to a server."
        ),
        "icon": "clipboard",
        "kind": "sign",
    },
    {
        "slug": "add-text-to-pdf",
        "endpoint": "pdf_markup.add_text_to_pdf",
        "name": "Add Text to PDF",
        "short_name": "Add Text to PDF",
        "summary": (
            "Place a text note, correction, reference, or label at a precise position on a "
            "PDF page."
        ),
        "icon": "file-text",
        "kind": "text",
    },
    {
        "slug": "stamp-pdf",
        "endpoint": "pdf_markup.stamp_pdf",
        "name": "Stamp PDF",
        "short_name": "Stamp PDF",
        "summary": (
            "Add DRAFT, APPROVED, CONFIDENTIAL, PAID, or custom stamps to selected PDF pages."
        ),
        "icon": "check",
        "kind": "stamp",
    },
    {
        "slug": "compare-pdf-text",
        "endpoint": "pdf_markup.compare_pdf_text",
        "name": "Compare PDF Text",
        "short_name": "Compare PDF Text",
        "summary": (
            "Compare selectable text from two PDF versions and review added, removed, and "
            "unchanged lines locally."
        ),
        "icon": "layers",
        "kind": "compare",
    },
]

PDF_MARKUP_TOOLS_BY_SLUG = {tool["slug"]: tool for tool in PDF_MARKUP_TOOLS}


@bp.app_context_processor
def inject_pdf_markup_tools() -> dict:
    return {"pdf_markup_tools": PDF_MARKUP_TOOLS}


def _render(slug: str):
    tool = PDF_MARKUP_TOOLS_BY_SLUG[slug]
    related = [candidate for candidate in PDF_MARKUP_TOOLS if candidate["slug"] != slug]
    return render_template(
        "pdf-markup-tool.html",
        tool=tool,
        related_tools=related[:3],
        page_title=tool["name"],
        meta_description=tool["summary"],
    )


@bp.get("/tools/sign-pdf/")
def sign_pdf():
    return _render("sign-pdf")


@bp.get("/tools/add-text-to-pdf/")
def add_text_to_pdf():
    return _render("add-text-to-pdf")


@bp.get("/tools/stamp-pdf/")
def stamp_pdf():
    return _render("stamp-pdf")


@bp.get("/tools/compare-pdf-text/")
def compare_pdf_text():
    return _render("compare-pdf-text")
