from __future__ import annotations

from flask import Blueprint, render_template

bp = Blueprint("pdf_tools", __name__)

PDF_TOOLS = [
    {
        "slug": "merge-pdf",
        "endpoint": "pdf_tools.merge_pdf",
        "name": "Merge PDF",
        "short_name": "Merge PDF",
        "summary": "Combine multiple PDF files into one document in your preferred order.",
        "category": "PDF",
        "icon": "layers",
        "kind": "merge",
    },
    {
        "slug": "split-pdf",
        "endpoint": "pdf_tools.split_pdf",
        "name": "Split PDF",
        "short_name": "Split PDF",
        "summary": "Extract selected pages or page ranges into a new PDF document.",
        "category": "PDF",
        "icon": "file-text",
        "kind": "split",
    },
    {
        "slug": "rotate-pdf",
        "endpoint": "pdf_tools.rotate_pdf",
        "name": "Rotate PDF",
        "short_name": "Rotate PDF",
        "summary": "Rotate every page or selected pages clockwise or counterclockwise.",
        "category": "PDF",
        "icon": "reset",
        "kind": "rotate",
    },
    {
        "slug": "images-to-pdf",
        "endpoint": "pdf_tools.images_to_pdf",
        "name": "Images to PDF",
        "short_name": "Images to PDF",
        "summary": "Turn JPG and PNG images into a single, downloadable PDF file.",
        "category": "PDF",
        "icon": "upload",
        "kind": "images",
    },
]

PDF_TOOLS_BY_SLUG = {tool["slug"]: tool for tool in PDF_TOOLS}


@bp.app_context_processor
def inject_pdf_tools() -> dict:
    return {"pdf_tools": PDF_TOOLS}


def _render_pdf_tool(slug: str):
    tool = PDF_TOOLS_BY_SLUG[slug]
    related_tools = [candidate for candidate in PDF_TOOLS if candidate["slug"] != slug][:3]
    return render_template(
        "pdf-tool.html",
        tool=tool,
        related_tools=related_tools,
        page_title=tool["name"],
        meta_description=tool["summary"],
    )


@bp.get("/tools/merge-pdf/")
def merge_pdf():
    return _render_pdf_tool("merge-pdf")


@bp.get("/tools/split-pdf/")
def split_pdf():
    return _render_pdf_tool("split-pdf")


@bp.get("/tools/rotate-pdf/")
def rotate_pdf():
    return _render_pdf_tool("rotate-pdf")


@bp.get("/tools/images-to-pdf/")
def images_to_pdf():
    return _render_pdf_tool("images-to-pdf")
