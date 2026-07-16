from __future__ import annotations

from flask import Blueprint, render_template

from .catalog import TOOLS

bp = Blueprint("word_tools", __name__)

WORD_UNSCRAMBLER = {
    "slug": "word-unscrambler",
    "name": "Word Unscrambler",
    "short_name": "Word Unscrambler",
    "summary": "Find exact anagrams and shorter English words that can be made from a set of letters.",
    "category": "Writing",
    "icon": "letters",
}


@bp.get("/tools/word-unscrambler/")
def word_unscrambler():
    return render_template(
        "word-unscrambler.html",
        tool=WORD_UNSCRAMBLER,
        related_tools=TOOLS[:3],
        page_title=WORD_UNSCRAMBLER["name"],
        meta_description=WORD_UNSCRAMBLER["summary"],
    )
