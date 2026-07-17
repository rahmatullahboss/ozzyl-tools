from __future__ import annotations

from flask import Blueprint, render_template

from .halal_catalog import TOOLS

bp = Blueprint("word_tools", __name__)

WORD_UNSCRAMBLER = {
    "slug": "word-unscrambler",
    "name": "Word Unscrambler",
    "short_name": "Word Unscrambler",
    "summary": "Find exact anagrams and shorter English words that can be made from a set of letters.",
    "category": "Writing",
    "icon": "letters",
}

WORD_UNSCRAMBLER_FAQ = [
    {
        "question": "What does the Word Unscrambler do?",
        "answer": "It finds exact anagrams and shorter common-English words that can be built from the letters you enter.",
    },
    {
        "question": "Does the Word Unscrambler support repeated letters?",
        "answer": "Yes. A result only uses each letter as many times as it appears in your original letter set.",
    },
    {
        "question": "Are my letters uploaded?",
        "answer": "No. Word matching happens in your browser after the public dictionary file is downloaded.",
    },
]


@bp.get("/tools/word-unscrambler/")
def word_unscrambler():
    return render_template(
        "word-unscrambler.html",
        tool=WORD_UNSCRAMBLER,
        faq_items=WORD_UNSCRAMBLER_FAQ,
        related_tools=TOOLS[:3],
        page_title="Free Word Unscrambler and Anagram Solver",
        meta_description=(
            "Unscramble letters into exact anagrams and shorter English words for free. "
            "Supports repeated letters and works privately in your browser."
        ),
    )
