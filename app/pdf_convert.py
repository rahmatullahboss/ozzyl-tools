from __future__ import annotations

from flask import Blueprint, render_template

bp = Blueprint("pdf_convert", __name__)

PDF_CONVERT_TOOLS = [
    {
        "slug": "pdf-to-images",
        "endpoint": "pdf_convert.pdf_to_images",
        "name": "PDF to Images",
        "short_name": "PDF to Images",
        "summary": "Render all or selected PDF pages as high-quality PNG or JPEG images directly in your browser.",
        "icon": "file-text",
        "kind": "images",
    },
    {
        "slug": "pdf-to-text",
        "endpoint": "pdf_convert.pdf_to_text",
        "name": "PDF to Text",
        "short_name": "PDF to Text",
        "summary": "Extract selectable text from all or selected PDF pages and download a clean TXT file.",
        "icon": "letters",
        "kind": "text",
    },
    {
        "slug": "flatten-pdf",
        "endpoint": "pdf_convert.flatten_pdf",
        "name": "Flatten PDF Forms",
        "short_name": "Flatten PDF",
        "summary": "Flatten filled PDF form fields into the page content for easier sharing and printing.",
        "icon": "layers",
        "kind": "flatten",
    },
    {
        "slug": "resize-pdf-pages",
        "endpoint": "pdf_convert.resize_pdf_pages",
        "name": "Resize PDF Pages",
        "short_name": "Resize PDF Pages",
        "summary": "Resize selected PDF pages to A4, Letter, or custom dimensions with fit, center, or stretch modes.",
        "icon": "layers",
        "kind": "resize",
    },
]

PDF_CONVERT_TOOLS_BY_SLUG = {tool["slug"]: tool for tool in PDF_CONVERT_TOOLS}


@bp.app_context_processor
def inject_pdf_convert_tools() -> dict:
    return {"pdf_convert_tools": PDF_CONVERT_TOOLS}


def _render(slug: str):
    tool = PDF_CONVERT_TOOLS_BY_SLUG[slug]
    related = [candidate for candidate in PDF_CONVERT_TOOLS if candidate["slug"] != slug]
    return render_template(
        "pdf-convert-tool.html",
        tool=tool,
        related_tools=related[:3],
        page_title=tool["name"],
        meta_description=tool["summary"],
    )


@bp.get("/tools/pdf-to-images/")
def pdf_to_images():
    return _render("pdf-to-images")


@bp.get("/tools/pdf-to-text/")
def pdf_to_text():
    return _render("pdf-to-text")


@bp.get("/tools/flatten-pdf/")
def flatten_pdf():
    return _render("flatten-pdf")


@bp.get("/tools/resize-pdf-pages/")
def resize_pdf_pages():
    return _render("resize-pdf-pages")
