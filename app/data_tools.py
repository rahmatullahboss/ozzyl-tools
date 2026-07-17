from __future__ import annotations

DATA_TOOLS = [
    {
        "slug": "utm-campaign-url-builder",
        "endpoint": "utility_tools.utm_builder",
        "name": "UTM Campaign URL Builder",
        "short_name": "UTM Builder",
        "summary": (
            "Build consistent, analytics-ready campaign URLs while preserving existing query "
            "parameters and previewing every UTM value."
        ),
        "category": "Marketing",
        "icon": "tag",
        "kind": "utm",
    },
    {
        "slug": "qr-code-generator",
        "endpoint": "utility_tools.qr_code_generator",
        "name": "QR Code Generator",
        "short_name": "QR Code Generator",
        "summary": (
            "Create customizable QR codes for URLs or text and download them as PNG or SVG."
        ),
        "category": "Marketing",
        "icon": "boxes",
        "kind": "qr",
    },
    {
        "slug": "json-formatter-validator",
        "endpoint": "utility_tools.json_formatter",
        "name": "JSON Formatter & Validator",
        "short_name": "JSON Formatter",
        "summary": (
            "Validate, format, minify, sort, inspect, copy, and download JSON without uploading it."
        ),
        "category": "Data",
        "icon": "layers",
        "kind": "json",
    },
    {
        "slug": "csv-json-converter",
        "endpoint": "utility_tools.csv_json_converter",
        "name": "CSV & JSON Converter",
        "short_name": "CSV ↔ JSON Converter",
        "summary": (
            "Convert CSV, TSV, semicolon, or pipe-delimited data to JSON and export JSON arrays "
            "back to clean CSV."
        ),
        "category": "Data",
        "icon": "file-text",
        "kind": "csv_json",
    },
    {
        "slug": "base64-encoder-decoder",
        "endpoint": "utility_tools.base64_tool",
        "name": "Base64 Encoder & Decoder",
        "short_name": "Base64 Tool",
        "summary": (
            "Encode and decode Unicode text with standard or URL-safe Base64 options locally."
        ),
        "category": "Developer",
        "icon": "letters",
        "kind": "base64",
    },
    {
        "slug": "uuid-generator",
        "endpoint": "utility_tools.uuid_generator",
        "name": "UUID Generator",
        "short_name": "UUID Generator",
        "summary": (
            "Generate one or many cryptographically random UUID v4 identifiers with export options."
        ),
        "category": "Developer",
        "icon": "sparkles",
        "kind": "uuid",
    },
    {
        "slug": "unix-timestamp-converter",
        "endpoint": "utility_tools.timestamp_converter",
        "name": "Unix Timestamp Converter",
        "short_name": "Timestamp Converter",
        "summary": (
            "Convert Unix seconds or milliseconds to readable dates and convert local dates back "
            "to both timestamp formats."
        ),
        "category": "Developer",
        "icon": "clock",
        "kind": "timestamp",
    },
    {
        "slug": "regex-tester",
        "endpoint": "utility_tools.regex_tester",
        "name": "Regular Expression Tester",
        "short_name": "Regex Tester",
        "summary": (
            "Test patterns, flags, capture groups, and replacements in a timeout-protected "
            "browser worker."
        ),
        "category": "Developer",
        "icon": "search",
        "kind": "regex",
    },
]

DATA_TOOLS_BY_SLUG = {tool["slug"]: tool for tool in DATA_TOOLS}
