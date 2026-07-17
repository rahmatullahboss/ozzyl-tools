from __future__ import annotations

from .catalog import DOCUMENT_TYPES
from .catalog import TOOLS as UNFILTERED_TOOLS

BLOCKED_TOOL_SLUGS = {
    "loan-payment-calculator",
    "compound-growth-calculator",
}

TOOLS = [tool for tool in UNFILTERED_TOOLS if tool["slug"] not in BLOCKED_TOOL_SLUGS]
TOOLS_BY_SLUG = {tool["slug"]: tool for tool in TOOLS}
CATEGORIES = tuple(dict.fromkeys(tool["category"] for tool in TOOLS))
