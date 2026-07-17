from __future__ import annotations

from .catalog import DOCUMENT_TYPES as DOCUMENT_TYPES
from .catalog import TOOLS as TOOLS

TOOLS_BY_SLUG = {tool["slug"]: tool for tool in TOOLS}
CATEGORIES = tuple(dict.fromkeys(tool["category"] for tool in TOOLS))

__all__ = ["CATEGORIES", "DOCUMENT_TYPES", "TOOLS", "TOOLS_BY_SLUG"]
