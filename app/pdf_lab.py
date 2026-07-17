from __future__ import annotations

from flask import Blueprint, render_template

bp = Blueprint("pdf_lab", __name__)

PDF_LAB_TOOLS = [
    {
        "slug": "crop-pdf",
        "endpoint": "pdf_lab.crop_pdf",
        "name": "Crop PDF",
        "short_name": "Crop PDF",
        "summary": "Trim unwanted margins from all or selected PDF pages using precise percentage controls.",
        "category": "PDF",
        "icon": "target",
        "kind": "crop",
    },
    {
        "slug": "duplicate-pdf-pages",
        "endpoint": "pdf_lab.duplicate_pages",
        "name": "Duplicate PDF Pages",
        "short_name": "Duplicate Pages",
        "summary": "Copy selected PDF pages one or more times and place them after each page or at the end.",
        "category": "PDF",
        "icon": "copy",
        "kind": "duplicate",
    },
    {
        "slug": "insert-blank-pdf-pages",
        "endpoint": "pdf_lab.insert_blank_pages",
        "name": "Insert Blank PDF Pages",
        "short_name": "Insert Blank Pages",
        "summary": "Add one or more blank pages before, after, or at the end of an existing PDF.",
        "category": "PDF",
        "icon": "file-text",
        "kind": "blank",
    },
    {
        "slug": "edit-pdf-metadata",
        "endpoint": "pdf_lab.edit_metadata",
        "name": "Edit PDF Metadata",
        "short_name": "Edit PDF Metadata",
        "summary": "Review and update a PDF title, author, subject, and keywords without uploading the document.",
        "category": "PDF",
        "icon": "sparkles",
        "kind": "metadata",
    },
]

PDF_LAB_TOOLS_BY_SLUG = {tool["slug"]: tool for tool in PDF_LAB_TOOLS}


@bp.app_context_processor
def inject_pdf_lab_tools() -> dict:
    return {"pdf_lab_tools": PDF_LAB_TOOLS}


def _render(slug: str):
    tool = PDF_LAB_TOOLS_BY_SLUG[slug]
    related = [candidate for candidate in PDF_LAB_TOOLS if candidate["slug"] != slug]
    return render_template(
        "pdf-lab-tool.html",
        tool=tool,
        related_tools=related[:3],
        page_title=tool["name"],
        meta_description=tool["summary"],
    )


@bp.get("/tools/crop-pdf/")
def crop_pdf():
    return _render("crop-pdf")


@bp.get("/tools/duplicate-pdf-pages/")
def duplicate_pages():
    return _render("duplicate-pdf-pages")


@bp.get("/tools/insert-blank-pdf-pages/")
def insert_blank_pages():
    return _render("insert-blank-pdf-pages")


@bp.get("/tools/edit-pdf-metadata/")
def edit_metadata():
    return _render("edit-pdf-metadata")
