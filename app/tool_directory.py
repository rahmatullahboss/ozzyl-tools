from __future__ import annotations

from typing import Any

from .growth_tools import GROWTH_TOOLS
from .halal_catalog import DOCUMENT_TYPES, TOOLS
from .pdf_convert import PDF_CONVERT_TOOLS
from .pdf_lab import PDF_LAB_TOOLS
from .pdf_markup import PDF_MARKUP_TOOLS
from .pdf_tools import PDF_TOOLS
from .utility_tools import UTILITY_TOOLS

DirectoryItem = dict[str, Any]

DIRECTORY_GROUPS = {
    "business-calculators": {
        "name": "Business Calculators",
        "short_name": "Calculators",
        "title": "Free Business Calculators",
        "summary": (
            "Calculate pricing, profit, VAT, payroll, break-even points, inventory, and "
            "practical business performance metrics without signing up."
        ),
        "intro": (
            "Use transparent, formula-backed calculators for recurring sales, team, tax, "
            "operations, and planning work. Results are estimates and should be checked before "
            "important business, payroll, or tax decisions."
        ),
        "icon": "chart-up",
        "keywords": "profit margin markup VAT payroll break-even inventory business calculator",
    },
    "seo-webmaster-tools": {
        "name": "SEO & Webmaster Tools",
        "short_name": "SEO tools",
        "title": "Free SEO and Webmaster Tools",
        "summary": (
            "Prepare metadata, structured data, sitemaps, robots rules, campaign URLs, and "
            "content checks for organic search workflows."
        ),
        "intro": (
            "Build and inspect the technical elements that help search engines understand a "
            "website. These utilities support accurate implementation; they do not guarantee "
            "indexing, rankings, clicks, or rich results."
        ),
        "icon": "search",
        "keywords": "SEO meta tags schema sitemap robots keyword density headings UTM QR",
    },
    "data-developer-tools": {
        "name": "Data & Developer Tools",
        "short_name": "Developer tools",
        "title": "Free Data and Developer Utilities",
        "summary": (
            "Format JSON, convert CSV, test regular expressions, generate UUIDs, decode Base64, "
            "and work with Unix timestamps locally."
        ),
        "intro": (
            "Handle common data cleanup and development tasks directly in the browser. Inputs "
            "stay on the device by default, making the tools useful for quick validation and "
            "transformation without unnecessary uploads."
        ),
        "icon": "layers",
        "keywords": "JSON formatter CSV converter regex tester UUID Base64 Unix timestamp",
    },
    "everyday-utilities": {
        "name": "Writing, Math & Security Utilities",
        "short_name": "Everyday utilities",
        "title": "Free Everyday Online Utilities",
        "summary": (
            "Count and transform text, calculate percentages, generate strong passwords, and "
            "find words from letters with lightweight browser tools."
        ),
        "intro": (
            "Use fast utilities for writing, simple math, word work, and password generation. "
            "They require no account and are designed for small recurring tasks rather than "
            "heavy dashboards."
        ),
        "icon": "sparkles",
        "keywords": "word counter case converter percentage password generator word unscrambler",
    },
    "pdf-tools": {
        "name": "PDF Tools",
        "short_name": "PDF tools",
        "title": "Free Private PDF Tools",
        "summary": (
            "Merge, split, crop, reorder, convert, sign, stamp, compare, inspect, and edit PDF "
            "documents directly in the browser."
        ),
        "intro": (
            "Complete common PDF workflows without uploading supported files to an Ozzyl Tools "
            "server. Review every generated document before sharing it, especially signatures, "
            "redactions, page order, and extracted text."
        ),
        "icon": "file-text",
        "keywords": "merge PDF split PDF crop PDF convert PDF sign PDF watermark PDF pages",
    },
    "business-document-generators": {
        "name": "Business Document Generators",
        "short_name": "Documents",
        "title": "Free Business Document Generators",
        "summary": (
            "Create invoices, quotations, receipts, purchase orders, and other professional "
            "business documents with local draft saving."
        ),
        "intro": (
            "Prepare reusable customer and supplier documents, add business details and line "
            "items, then print or save the result as PDF. Verify taxes, terms, totals, and legal "
            "requirements before sending."
        ),
        "icon": "clipboard",
        "keywords": "invoice generator quotation receipt purchase order business document PDF",
    },
}


def _tool_item(tool: dict, group: str, family: str) -> DirectoryItem:
    endpoint = tool.get("endpoint", "main.calculator")
    values = {} if "endpoint" in tool else {"slug": tool["slug"]}
    category = tool.get("category", "PDF" if group == "pdf-tools" else family)
    return {
        "slug": tool["slug"],
        "name": tool["name"],
        "short_name": tool["short_name"],
        "summary": tool["summary"],
        "category": category,
        "icon": tool["icon"],
        "group": group,
        "family": family,
        "endpoint": endpoint,
        "url_values": values,
        "search_text": " ".join(
            [
                tool["name"],
                tool["short_name"],
                tool["summary"],
                category,
                DIRECTORY_GROUPS[group]["keywords"],
            ]
        ).lower(),
    }


def _document_item(kind: str, document: dict) -> DirectoryItem:
    return {
        "slug": f"{kind}-generator",
        "name": document["name"],
        "short_name": document["noun"],
        "summary": document["summary"],
        "category": "Documents",
        "icon": document["icon"],
        "group": "business-document-generators",
        "family": "Document generator",
        "endpoint": "main.document_generator",
        "url_values": {"document_type": kind},
        "search_text": " ".join(
            [
                document["name"],
                document["noun"],
                document["summary"],
                DIRECTORY_GROUPS["business-document-generators"]["keywords"],
            ]
        ).lower(),
    }


DIRECTORY_ITEMS: list[DirectoryItem] = []
DIRECTORY_ITEMS.extend(
    _tool_item(tool, "business-calculators", "Business calculator") for tool in TOOLS
)
DIRECTORY_ITEMS.extend(
    _tool_item(tool, "business-calculators", "Business growth calculator") for tool in GROWTH_TOOLS
)
for tool in UTILITY_TOOLS:
    if tool["category"] in {"SEO", "Webmaster", "Content", "Marketing"}:
        group = "seo-webmaster-tools"
    elif tool["category"] in {"Data", "Developer"}:
        group = "data-developer-tools"
    else:
        group = "everyday-utilities"
    DIRECTORY_ITEMS.append(_tool_item(tool, group, "Browser utility"))

DIRECTORY_ITEMS.append(
    {
        "slug": "word-unscrambler",
        "name": "Word Unscrambler",
        "short_name": "Word Unscrambler",
        "summary": "Find exact anagrams and shorter English words from a set of letters.",
        "category": "Writing",
        "icon": "letters",
        "group": "everyday-utilities",
        "family": "Browser utility",
        "endpoint": "word_tools.word_unscrambler",
        "url_values": {},
        "search_text": (
            "word unscrambler anagram letters writing words "
            + DIRECTORY_GROUPS["everyday-utilities"]["keywords"]
        ).lower(),
    }
)

for collection, family in (
    (PDF_TOOLS, "PDF organizer"),
    (PDF_LAB_TOOLS, "PDF editor"),
    (PDF_CONVERT_TOOLS, "PDF converter"),
    (PDF_MARKUP_TOOLS, "PDF markup tool"),
):
    DIRECTORY_ITEMS.extend(_tool_item(tool, "pdf-tools", family) for tool in collection)

DIRECTORY_ITEMS.extend(_document_item(kind, document) for kind, document in DOCUMENT_TYPES.items())
DIRECTORY_ITEMS_BY_SLUG = {item["slug"]: item for item in DIRECTORY_ITEMS}
DIRECTORY_ITEMS_BY_GROUP = {
    group_slug: [item for item in DIRECTORY_ITEMS if item["group"] == group_slug]
    for group_slug in DIRECTORY_GROUPS
}

__all__ = [
    "DIRECTORY_GROUPS",
    "DIRECTORY_ITEMS",
    "DIRECTORY_ITEMS_BY_GROUP",
    "DIRECTORY_ITEMS_BY_SLUG",
]
