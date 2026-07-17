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
    {
        "slug": "delete-pdf-pages",
        "endpoint": "pdf_tools.delete_pdf_pages",
        "name": "Delete PDF Pages",
        "short_name": "Delete PDF Pages",
        "summary": "Remove unwanted pages and download a clean copy of your PDF.",
        "category": "PDF",
        "icon": "trash",
        "kind": "delete",
    },
    {
        "slug": "reorder-pdf-pages",
        "endpoint": "pdf_tools.reorder_pdf_pages",
        "name": "Reorder PDF Pages",
        "short_name": "Reorder PDF Pages",
        "summary": "Arrange every PDF page in a new custom order without uploading the file.",
        "category": "PDF",
        "icon": "layers",
        "kind": "reorder",
    },
    {
        "slug": "add-pdf-page-numbers",
        "endpoint": "pdf_tools.add_pdf_page_numbers",
        "name": "Add PDF Page Numbers",
        "short_name": "PDF Page Numbers",
        "summary": "Add customizable page numbers to all or selected pages of a PDF.",
        "category": "PDF",
        "icon": "file-text",
        "kind": "page_numbers",
    },
    {
        "slug": "watermark-pdf",
        "endpoint": "pdf_tools.watermark_pdf",
        "name": "Watermark PDF",
        "short_name": "Watermark PDF",
        "summary": "Add a private, draft, confidential, or custom text watermark to a PDF.",
        "category": "PDF",
        "icon": "sparkles",
        "kind": "watermark",
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


@bp.get("/tools/delete-pdf-pages/")
def delete_pdf_pages():
    return _render_pdf_tool("delete-pdf-pages")


@bp.get("/tools/reorder-pdf-pages/")
def reorder_pdf_pages():
    return _render_pdf_tool("reorder-pdf-pages")


@bp.get("/tools/add-pdf-page-numbers/")
def add_pdf_page_numbers():
    return _render_pdf_tool("add-pdf-page-numbers")


@bp.get("/tools/watermark-pdf/")
def watermark_pdf():
    return _render_pdf_tool("watermark-pdf")
