from __future__ import annotations

from html import escape

from flask import Blueprint, abort, render_template, request, url_for

from .guide_catalog import GUIDES, GUIDES_BY_SLUG

bp = Blueprint("guides", __name__)


def _resolve_tool(reference: dict) -> dict:
    return {
        **reference,
        "url": url_for(reference["endpoint"], **reference.get("values", {})),
    }


def _resolved_guide(guide: dict) -> dict:
    return {
        **guide,
        "url": url_for("guides.detail", slug=guide["slug"]),
        "primary_tool": _resolve_tool(guide["primary_tool"]),
        "related_tools": [_resolve_tool(tool) for tool in guide["related_tools"]],
    }


def _guide_urls(*, external: bool) -> list[str]:
    urls = [url_for("guides.index", _external=external)]
    urls.extend(
        url_for("guides.detail", slug=guide["slug"], _external=external) for guide in GUIDES
    )
    return urls


def _contextual_guide() -> dict | None:
    current_path = request.path
    for guide in GUIDES:
        paths = {
            url_for(reference["endpoint"], **reference.get("values", {}))
            for reference in guide["context_tools"]
        }
        if current_path in paths:
            resolved = _resolved_guide(guide)
            return {
                "title": resolved["short_title"],
                "summary": resolved["summary"],
                "url": resolved["url"],
                "reading_time": resolved["reading_time"],
            }
    return None


@bp.app_context_processor
def inject_guide_navigation() -> dict:
    return {
        "guide_index_url": url_for("guides.index"),
        "contextual_guide": _contextual_guide(),
    }


@bp.after_app_request
def add_guide_discovery(response):
    if response.status_code != 200:
        return response

    if request.endpoint == "main.sitemap":
        from .routes import CONTENT_UPDATED

        body = response.get_data(as_text=True)
        index_url = url_for("guides.index", _external=True)
        marker = f"<loc>{escape(index_url)}</loc>"
        if marker not in body:
            entries = "".join(
                "<url><loc>"
                + escape(url)
                + "</loc><lastmod>"
                + CONTENT_UPDATED
                + "</lastmod></url>"
                for url in _guide_urls(external=True)
            )
            response.set_data(body.replace("</urlset>", entries + "</urlset>"))

    if request.endpoint == "main.llms_txt":
        body = response.get_data(as_text=True)
        index_url = url_for("guides.index", _external=True)
        marker = f"[Practical Guides]({index_url})"
        if marker not in body:
            lines = [
                "",
                "## Practical guides",
                f"- {marker}: Detailed workflows linked to the free tools.",
            ]
            lines.extend(
                (
                    f"- [{guide['short_title']}]"
                    f"({url_for('guides.detail', slug=guide['slug'], _external=True)}): "
                    f"{guide['summary']}"
                )
                for guide in GUIDES
            )
            insertion = "\n".join(lines) + "\n"
            response.set_data(body.replace("\n## Usage notes", insertion + "\n## Usage notes"))

    return response


@bp.get("/guides/")
def index():
    resolved_guides = [_resolved_guide(guide) for guide in GUIDES]
    return render_template(
        "guides-index.html",
        guides=resolved_guides,
        page_title="Practical Business, PDF, SEO, and Developer Guides",
        meta_description=(
            "Read practical guides for pricing, invoices, private PDF workflows, SEO metadata, "
            "and JSON validation, with free tools linked at each step."
        ),
    )


@bp.get("/guides/<slug>/")
def detail(slug: str):
    guide = GUIDES_BY_SLUG.get(slug)
    if not guide:
        abort(404)

    resolved = _resolved_guide(guide)
    related_guides = [
        _resolved_guide(candidate) for candidate in GUIDES if candidate["slug"] != slug
    ][:3]
    return render_template(
        "guide-detail.html",
        guide=resolved,
        related_guides=related_guides,
        page_title=guide["title"],
        meta_description=guide["summary"],
    )
