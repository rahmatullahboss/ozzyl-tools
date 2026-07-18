from __future__ import annotations

from html import escape

from flask import Blueprint, abort, jsonify, render_template, request, url_for

from .tool_directory import DIRECTORY_GROUPS, DIRECTORY_ITEMS, DIRECTORY_ITEMS_BY_GROUP

bp = Blueprint("tool_directory", __name__)


def _resolved_item(item: dict, *, external: bool = False) -> dict:
    return {
        **item,
        "url": url_for(item["endpoint"], _external=external, **item["url_values"]),
    }


def _resolved_groups() -> list[dict]:
    return [
        {
            **group,
            "slug": slug,
            "count": len(DIRECTORY_ITEMS_BY_GROUP[slug]),
            "url": url_for("tool_directory.category", group_slug=slug),
        }
        for slug, group in DIRECTORY_GROUPS.items()
    ]


def _directory_discovery_urls(*, external: bool) -> list[str]:
    urls = [url_for("tool_directory.index", _external=external)]
    urls.extend(
        url_for("tool_directory.category", group_slug=slug, _external=external)
        for slug in DIRECTORY_GROUPS
    )
    return urls


@bp.app_context_processor
def inject_directory_navigation() -> dict:
    return {"directory_groups": _resolved_groups()}


@bp.after_app_request
def add_directory_discovery(response):
    if response.status_code != 200:
        return response

    if request.endpoint == "main.sitemap":
        from .routes import CONTENT_UPDATED

        entries = "".join(
            "<url><loc>"
            + escape(url)
            + "</loc><lastmod>"
            + CONTENT_UPDATED
            + "</lastmod></url>"
            for url in _directory_discovery_urls(external=True)
        )
        body = response.get_data(as_text=True)
        if url_for("tool_directory.index", _external=True) not in body:
            response.set_data(body.replace("</urlset>", entries + "</urlset>"))

    if request.endpoint == "main.llms_txt":
        body = response.get_data(as_text=True)
        directory_url = url_for("tool_directory.index", _external=True)
        if directory_url not in body:
            lines = [
                "",
                "## Tool directory",
                f"- [All Tools]({directory_url}): Browse the complete public tool catalog.",
            ]
            lines.extend(
                f"- [{group['name']}]({url_for('tool_directory.category', group_slug=slug, _external=True)}): {group['summary']}"
                for slug, group in DIRECTORY_GROUPS.items()
            )
            insertion = "\n".join(lines) + "\n"
            response.set_data(body.replace("\n## Usage notes", insertion + "\n## Usage notes"))

    return response


@bp.get("/tools/")
def index():
    return render_template(
        "tool-directory.html",
        directory_mode="all",
        directory_items=[_resolved_item(item) for item in DIRECTORY_ITEMS],
        directory_groups=_resolved_groups(),
        active_group=None,
        page_title="All Free Online Tools",
        meta_description=(
            "Browse free business calculators, private PDF tools, SEO utilities, developer "
            "tools, writing helpers, and document generators without signing up."
        ),
    )


@bp.get("/tools/category/<group_slug>/")
def category(group_slug: str):
    group = DIRECTORY_GROUPS.get(group_slug)
    if not group:
        abort(404)
    return render_template(
        "tool-directory.html",
        directory_mode="category",
        directory_items=[_resolved_item(item) for item in DIRECTORY_ITEMS_BY_GROUP[group_slug]],
        directory_groups=_resolved_groups(),
        active_group={
            **group,
            "slug": group_slug,
            "count": len(DIRECTORY_ITEMS_BY_GROUP[group_slug]),
        },
        page_title=group["title"],
        meta_description=group["summary"],
    )


@bp.get("/tools-index.json")
def tools_index():
    tools = [
        {
            "slug": item["slug"],
            "name": item["name"],
            "short_name": item["short_name"],
            "summary": item["summary"],
            "category": item["category"],
            "group": item["group"],
            "family": item["family"],
            "search_text": item["search_text"],
            "url": _resolved_item(item)["url"],
        }
        for item in DIRECTORY_ITEMS
    ]
    return jsonify({"count": len(tools), "tools": tools})
