from __future__ import annotations

SEO_TOOLS = [
    {
        "slug": "meta-tag-serp-preview",
        "endpoint": "utility_tools.meta_tag_preview",
        "name": "Meta Tag & SERP Preview Generator",
        "short_name": "Meta & SERP Preview",
        "summary": (
            "Write title, description, canonical, and robots tags while previewing a search result."
        ),
        "category": "SEO",
        "icon": "search",
        "kind": "meta",
    },
    {
        "slug": "open-graph-generator",
        "endpoint": "utility_tools.open_graph_generator",
        "name": "Open Graph & Social Meta Generator",
        "short_name": "Open Graph Generator",
        "summary": (
            "Generate Open Graph and Twitter card tags with a live social-sharing preview."
        ),
        "category": "SEO",
        "icon": "share",
        "kind": "open_graph",
    },
    {
        "slug": "robots-txt-generator-tester",
        "endpoint": "utility_tools.robots_txt_tool",
        "name": "Robots.txt Generator & Rule Tester",
        "short_name": "Robots.txt Tool",
        "summary": (
            "Build crawler directives and test whether a path is allowed for a selected user agent."
        ),
        "category": "Webmaster",
        "icon": "shield",
        "kind": "robots",
    },
    {
        "slug": "xml-sitemap-generator",
        "endpoint": "utility_tools.xml_sitemap_generator",
        "name": "XML Sitemap Generator & Validator",
        "short_name": "XML Sitemap Generator",
        "summary": (
            "Validate absolute URLs, remove duplicates, and generate a standards-friendly XML sitemap."
        ),
        "category": "Webmaster",
        "icon": "layers",
        "kind": "sitemap",
    },
    {
        "slug": "schema-markup-generator",
        "endpoint": "utility_tools.schema_markup_generator",
        "name": "Schema Markup JSON-LD Generator",
        "short_name": "Schema Markup Generator",
        "summary": ("Create valid JSON-LD for Organization, WebSite, Article, or FAQPage content."),
        "category": "SEO",
        "icon": "boxes",
        "kind": "schema",
    },
    {
        "slug": "seo-slug-generator",
        "endpoint": "utility_tools.seo_slug_generator",
        "name": "SEO Slug Generator",
        "short_name": "Slug Generator",
        "summary": (
            "Turn a page title into a clean lowercase URL slug with Unicode or ASCII output."
        ),
        "category": "SEO",
        "icon": "tag",
        "kind": "slug",
    },
    {
        "slug": "keyword-density-analyzer",
        "endpoint": "utility_tools.keyword_density_analyzer",
        "name": "Keyword Density & Content Analyzer",
        "short_name": "Keyword Density Analyzer",
        "summary": (
            "Measure word frequency, density, readability length, and repeated terms without uploading text."
        ),
        "category": "Content",
        "icon": "chart-up",
        "kind": "keyword_density",
    },
    {
        "slug": "heading-structure-checker",
        "endpoint": "utility_tools.heading_structure_checker",
        "name": "HTML Heading Structure Checker",
        "short_name": "Heading Checker",
        "summary": (
            "Inspect H1–H6 order, detect skipped levels, and review the document heading outline."
        ),
        "category": "SEO",
        "icon": "file-text",
        "kind": "headings",
    },
]

SEO_TOOLS_BY_SLUG = {tool["slug"]: tool for tool in SEO_TOOLS}
