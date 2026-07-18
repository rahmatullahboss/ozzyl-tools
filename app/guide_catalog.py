from __future__ import annotations

from typing import Any

Guide = dict[str, Any]

GUIDES: list[Guide] = [
    {
        "slug": "profit-margin-vs-markup",
        "title": "Profit Margin vs Markup: Formulas, Examples, and Pricing Workflow",
        "short_title": "Profit Margin vs Markup",
        "summary": (
            "Understand the difference between margin and markup, calculate both correctly, and "
            "use them to set sustainable selling prices."
        ),
        "category": "Business pricing",
        "reading_time": "8 min read",
        "published": "2026-07-18",
        "updated": "2026-07-18",
        "primary_tool": {
            "endpoint": "main.calculator",
            "values": {"slug": "profit-margin-calculator"},
            "label": "Open Profit Margin Calculator",
            "description": "Enter cost and selling price to calculate profit, margin, and markup together.",
        },
        "related_tools": [
            {
                "endpoint": "main.calculator",
                "values": {"slug": "markup-calculator"},
                "label": "Markup Calculator",
            },
            {
                "endpoint": "main.calculator",
                "values": {"slug": "discount-calculator"},
                "label": "Discount Calculator",
            },
            {
                "endpoint": "main.document_generator",
                "values": {"document_type": "quotation"},
                "label": "Quotation Generator",
            },
        ],
        "context_tools": [
            {"endpoint": "main.calculator", "values": {"slug": "profit-margin-calculator"}},
            {"endpoint": "main.calculator", "values": {"slug": "markup-calculator"}},
        ],
        "takeaways": [
            "Margin compares profit with revenue; markup compares profit with cost.",
            "A 30% markup is not the same as a 30% margin.",
            "Use one pricing method consistently across products and quotations.",
            "Review discounts, fees, tax, wastage, and delivery costs before approving a price.",
        ],
        "sections": [
            {
                "heading": "The difference in one sentence",
                "paragraphs": [
                    "Profit margin answers: what percentage of the selling price remains as gross profit? Markup answers: what percentage was added on top of cost to reach the selling price? Both describe the same transaction from different starting points, which is why people often confuse them.",
                    "Margin is usually more useful for reporting and comparing profitability because it uses revenue as the base. Markup is often more convenient when a seller starts with a known cost and needs to build a selling price.",
                ],
                "example": {
                    "title": "Simple example",
                    "body": "If an item costs 100 and sells for 150, gross profit is 50. Margin is 50 ÷ 150 = 33.33%, while markup is 50 ÷ 100 = 50%.",
                },
            },
            {
                "heading": "Formulas you can verify",
                "paragraphs": [
                    "Keep the time period and currency consistent. Cost should include the direct cost you intend the calculation to represent, while selling price should be the amount before any later deductions that are not already included.",
                ],
                "bullets": [
                    "Gross profit = Selling price − Cost",
                    "Profit margin % = Gross profit ÷ Selling price × 100",
                    "Markup % = Gross profit ÷ Cost × 100",
                    "Selling price from markup = Cost × (1 + Markup ÷ 100)",
                    "Selling price from target margin = Cost ÷ (1 − Margin ÷ 100)",
                ],
                "note": "A target margin must remain below 100%. As the target approaches 100%, the required selling price rises sharply.",
            },
            {
                "heading": "Why using the wrong percentage creates pricing errors",
                "paragraphs": [
                    "Suppose a business wants a 40% margin on an item that costs 600. Adding 40% to cost produces a selling price of 840, but that price only creates a 28.57% margin. To achieve a true 40% margin, the selling price must be 600 ÷ 0.60 = 1,000.",
                    "The error becomes more damaging when it is repeated across a catalog, combined with discounts, or used for sales commissions. A clear pricing policy should therefore state whether every percentage is a margin, a markup, or a discount.",
                ],
                "bullets": [
                    "Label pricing spreadsheet columns clearly.",
                    "Do not reuse a markup percentage as a margin target.",
                    "Recalculate after discounts instead of assuming the original margin remains.",
                    "Separate gross profit from operating profit; overhead and other expenses still matter.",
                ],
            },
            {
                "heading": "A practical pricing workflow",
                "steps": [
                    "Build the complete unit cost: purchase or production cost, packaging, direct handling, and any other cost included in your pricing policy.",
                    "Choose whether your business controls prices using a target margin or a standard markup.",
                    "Calculate the initial selling price and round it according to your normal pricing rules.",
                    "Stress-test common discounts, marketplace fees, delivery charges, returns, and wastage.",
                    "Place the approved price into a quotation and state taxes, validity, delivery, and payment terms clearly.",
                    "Review actual margin after sales data becomes available and update the assumptions when costs change.",
                ],
            },
            {
                "heading": "Common mistakes to avoid",
                "bullets": [
                    "Using revenue as cost or cost as revenue.",
                    "Mixing monthly totals with per-unit values.",
                    "Ignoring refunds, marketplace fees, packaging, or delivery costs.",
                    "Applying a discount without checking the new margin.",
                    "Treating gross margin as final net profit after every operating expense.",
                    "Quoting a price without stating whether tax is included.",
                ],
                "paragraphs": [
                    "A calculator can prevent arithmetic mistakes, but the result is only as reliable as the cost definition. Write down what your business includes in cost and apply that definition consistently.",
                ],
            },
        ],
        "checklist": [
            "Cost and selling price use the same currency and unit.",
            "The percentage is labelled as margin, markup, or discount.",
            "Direct fees and expected wastage are included where appropriate.",
            "Discount scenarios have been tested.",
            "Tax and delivery treatment are clear in the quotation.",
            "Important pricing decisions have been reviewed by the responsible person.",
        ],
        "sources": [],
    },
    {
        "slug": "how-to-create-a-professional-invoice",
        "title": "How to Create a Professional Invoice: Complete Small-Business Checklist",
        "short_title": "Create a Professional Invoice",
        "summary": (
            "Create a clear invoice with correct parties, line items, totals, payment details, and "
            "review steps before sending it to a customer."
        ),
        "category": "Business documents",
        "reading_time": "9 min read",
        "published": "2026-07-18",
        "updated": "2026-07-18",
        "primary_tool": {
            "endpoint": "main.document_generator",
            "values": {"document_type": "invoice"},
            "label": "Open Invoice Generator",
            "description": "Create, preview, print, or save a professional invoice without an account.",
        },
        "related_tools": [
            {
                "endpoint": "main.document_generator",
                "values": {"document_type": "quotation"},
                "label": "Quotation Generator",
            },
            {
                "endpoint": "main.document_generator",
                "values": {"document_type": "receipt"},
                "label": "Receipt Generator",
            },
            {
                "endpoint": "main.calculator",
                "values": {"slug": "vat-calculator"},
                "label": "VAT Calculator",
            },
        ],
        "context_tools": [
            {"endpoint": "main.document_generator", "values": {"document_type": "invoice"}},
            {"endpoint": "main.document_generator", "values": {"document_type": "quotation"}},
        ],
        "takeaways": [
            "An invoice should identify the seller, customer, transaction, amount, due date, and payment method.",
            "Line items should explain what was delivered, not merely show a total.",
            "Taxes, discounts, shipping, and deposits should be transparent.",
            "Review legal and tax requirements that apply in your location before sending.",
        ],
        "sections": [
            {
                "heading": "What a professional invoice must communicate",
                "paragraphs": [
                    "A useful invoice is both a payment request and a transaction record. The customer should be able to understand who is charging them, what was supplied, how the total was calculated, when payment is due, and how to pay without asking a follow-up question.",
                    "Professional does not mean visually complicated. Consistent spacing, readable typography, accurate totals, and clear labels are more valuable than decorative elements that make the document harder to scan.",
                ],
            },
            {
                "heading": "Essential invoice fields",
                "bullets": [
                    "Your business name, contact details, and any required registration or tax identifier.",
                    "Customer name, business name, billing address, and contact information when needed.",
                    "A unique invoice number that follows a consistent sequence.",
                    "Issue date, supply or service date when relevant, and payment due date.",
                    "Clear descriptions, quantities, unit prices, discounts, and line totals.",
                    "Subtotal, taxes, shipping or service fees, deposits, credits, and final balance.",
                    "Currency, accepted payment method, account details, and payment reference instructions.",
                    "Terms covering late communication, delivery, revisions, returns, or warranty where relevant.",
                ],
                "note": "Required invoice fields vary by country, business type, and tax status. Verify local rules rather than copying another company's invoice blindly.",
            },
            {
                "heading": "Write line items customers can approve",
                "paragraphs": [
                    "A vague line such as ‘service charge’ creates disputes because it does not connect the amount to an agreed deliverable. Use the same language that appeared in the approved quotation, proposal, purchase order, or contract.",
                ],
                "example": {
                    "title": "Better line-item wording",
                    "body": "Instead of ‘Website work — 50,000’, write ‘Responsive company website development: design implementation, five content pages, contact form, testing, and deployment — 1 project × 50,000’.",
                },
                "bullets": [
                    "Group separate deliverables into separate rows when the customer may question one item.",
                    "Use measurable quantities such as hours, units, sessions, pages, or milestones.",
                    "Show discounts as explicit values instead of silently reducing a unit price.",
                    "Reference a purchase order, project code, or quotation number when the customer uses one.",
                ],
            },
            {
                "heading": "Calculate totals in a transparent order",
                "steps": [
                    "Calculate each line total from quantity and unit price.",
                    "Add the line totals to create the subtotal.",
                    "Apply line-level or document-level discounts according to the agreement.",
                    "Add taxable fees and calculate tax using the correct taxable base.",
                    "Add non-taxable delivery or other charges only when permitted and agreed.",
                    "Subtract deposits, advances, credit notes, or previous payments.",
                    "Confirm the final balance, currency, and amount in words if your process requires it.",
                ],
                "paragraphs": [
                    "Never hide a fee inside another line item. Transparent calculations reduce disputes and make bookkeeping easier for both parties.",
                ],
            },
            {
                "heading": "Send, track, and close the invoice",
                "paragraphs": [
                    "Before sending, export or print the final document and review the actual PDF rather than only the editing screen. Check page breaks, totals, customer details, bank information, and spelling. Send it through the agreed channel with a concise message that mentions the invoice number, amount, due date, and project.",
                ],
                "bullets": [
                    "Save an uneditable final copy using a predictable filename.",
                    "Record when and how the invoice was sent.",
                    "Use polite reminders before and after the due date.",
                    "When payment arrives, issue a receipt or mark the invoice paid in your accounting record.",
                    "Keep supporting quotations, purchase orders, delivery notes, and correspondence together.",
                ],
            },
        ],
        "checklist": [
            "Seller and customer details are correct.",
            "Invoice number is unique and follows the chosen sequence.",
            "Dates and payment deadline are unambiguous.",
            "Every line item matches the approved work or goods.",
            "Tax, discount, fees, deposits, and final balance are visible.",
            "Payment details have been independently checked.",
            "The exported PDF has been reviewed before sending.",
        ],
        "sources": [],
    },
    {
        "slug": "how-to-merge-pdf-files-privately",
        "title": "How to Merge PDF Files Privately Without Losing Page Order",
        "short_title": "Merge PDF Files Privately",
        "summary": (
            "Combine PDF files in the correct order, review page orientation and quality, and "
            "protect sensitive documents with a local-first workflow."
        ),
        "category": "PDF workflow",
        "reading_time": "7 min read",
        "published": "2026-07-18",
        "updated": "2026-07-18",
        "primary_tool": {
            "endpoint": "pdf_tools.merge_pdf",
            "values": {},
            "label": "Open Merge PDF Tool",
            "description": "Arrange and combine PDF files directly in a supported browser workflow.",
        },
        "related_tools": [
            {"endpoint": "pdf_tools.reorder_pdf_pages", "values": {}, "label": "Reorder PDF Pages"},
            {"endpoint": "pdf_tools.rotate_pdf", "values": {}, "label": "Rotate PDF"},
            {
                "endpoint": "pdf_tools.add_pdf_page_numbers",
                "values": {},
                "label": "Add PDF Page Numbers",
            },
        ],
        "context_tools": [
            {"endpoint": "pdf_tools.merge_pdf", "values": {}},
            {"endpoint": "pdf_tools.reorder_pdf_pages", "values": {}},
        ],
        "takeaways": [
            "Name and sort files before merging so the intended sequence is obvious.",
            "Preview page order, rotation, readability, and blank pages before sharing.",
            "Keep an untouched backup of every source file.",
            "For sensitive documents, prefer a workflow that clearly processes files locally.",
        ],
        "sections": [
            {
                "heading": "Plan the final document before combining files",
                "paragraphs": [
                    "Merging is simple when the final sequence is decided first. Write a short document map such as cover page, quotation, signed agreement, identity document, supporting evidence, and appendix. Then rename source files with numeric prefixes so their order is visible outside the tool as well.",
                ],
                "example": {
                    "title": "Predictable filenames",
                    "body": "Use names such as 01-cover.pdf, 02-proposal.pdf, 03-agreement.pdf, and 04-appendix.pdf instead of relying on download dates or vague names like final2.pdf.",
                },
            },
            {
                "heading": "A safe merge workflow",
                "steps": [
                    "Create a backup folder containing untouched copies of every source PDF.",
                    "Open the merge tool and select only the files required for the final package.",
                    "Arrange files in the planned sequence before generating the output.",
                    "Download the merged PDF using a new filename rather than overwriting a source file.",
                    "Open the result in a separate PDF viewer and inspect every transition between files.",
                    "Confirm the final page count and compare it with the sum of the source pages.",
                ],
            },
            {
                "heading": "Quality checks after merging",
                "bullets": [
                    "Page order follows the document map.",
                    "Portrait and landscape pages are readable without unexpected rotation.",
                    "No blank, duplicate, missing, cropped, or upside-down pages appear.",
                    "Scanned text remains legible at normal zoom.",
                    "Bookmarks, links, form fields, signatures, and annotations still behave as expected.",
                    "The filename, file size, and page count are appropriate for the delivery channel.",
                ],
                "paragraphs": [
                    "Different source PDFs can use different page sizes and internal structures. A successful merge operation does not automatically mean the resulting document is convenient to read or print.",
                ],
            },
            {
                "heading": "Privacy and sensitive files",
                "paragraphs": [
                    "Contracts, medical records, identity documents, payroll files, and customer data deserve extra care. Before selecting a web tool, read its privacy explanation and determine whether files are uploaded to a server or processed on the device. A local-first tool reduces unnecessary transfer, but you should still use a trusted device, updated browser, and secure storage.",
                ],
                "bullets": [
                    "Do not merge confidential documents on a shared or public computer.",
                    "Close unrelated browser tabs and remove temporary downloads after delivery.",
                    "Do not assume a black rectangle is secure redaction; use a purpose-built redaction process.",
                    "Avoid emailing an unprotected file when the recipient offers a secure portal.",
                    "Keep only the copies required by your retention policy and legal obligations.",
                ],
            },
            {
                "heading": "When merging is not the final step",
                "paragraphs": [
                    "After combining files you may need to reorder individual pages, rotate scans, remove blank pages, add page numbers, crop inconsistent margins, or flatten editable form fields. Perform these changes on a copy and review the document again after every destructive operation.",
                ],
                "note": "Electronic signatures and digital signatures are not automatically equivalent. Do not make legal-validity claims without checking the applicable law and signature method.",
            },
        ],
        "checklist": [
            "Untouched source files are backed up.",
            "The intended document order is written down.",
            "The merged page count matches expectations.",
            "Rotation, readability, and blank pages have been checked.",
            "Sensitive information is handled on a trusted device.",
            "The final file was opened and reviewed in a separate viewer.",
        ],
        "sources": [
            {
                "label": "Adobe Acrobat: Combine files into one PDF",
                "url": "https://helpx.adobe.com/acrobat/using/merging-files-single-pdf.html",
            }
        ],
    },
    {
        "slug": "seo-meta-tags-title-description-canonical",
        "title": "SEO Meta Tags Guide: Titles, Descriptions, Canonicals, and Social Previews",
        "short_title": "SEO Meta Tags Guide",
        "summary": (
            "Write descriptive page titles and meta descriptions, choose canonical URLs, and "
            "prepare accurate social preview metadata without making ranking guarantees."
        ),
        "category": "SEO fundamentals",
        "reading_time": "10 min read",
        "published": "2026-07-18",
        "updated": "2026-07-18",
        "primary_tool": {
            "endpoint": "utility_tools.meta_tag_preview",
            "values": {},
            "label": "Open Meta Tag & SERP Preview",
            "description": "Draft title, description, canonical, robots, and preview metadata in one place.",
        },
        "related_tools": [
            {
                "endpoint": "utility_tools.open_graph_generator",
                "values": {},
                "label": "Open Graph Generator",
            },
            {
                "endpoint": "utility_tools.seo_slug_generator",
                "values": {},
                "label": "SEO Slug Generator",
            },
            {
                "endpoint": "utility_tools.schema_markup_generator",
                "values": {},
                "label": "Schema Markup Generator",
            },
        ],
        "context_tools": [
            {"endpoint": "utility_tools.meta_tag_preview", "values": {}},
            {"endpoint": "utility_tools.open_graph_generator", "values": {}},
            {"endpoint": "utility_tools.seo_slug_generator", "values": {}},
        ],
        "takeaways": [
            "Every important page should have a descriptive title that matches its visible content.",
            "A meta description is a useful summary, but search engines may choose another snippet.",
            "Canonical annotations help indicate a preferred URL among duplicate or near-duplicate pages.",
            "Metadata should describe the page accurately; it does not guarantee rankings or rich results.",
        ],
        "sections": [
            {
                "heading": "Start with the page purpose, not a keyword list",
                "paragraphs": [
                    "Before writing metadata, define the page in one sentence: who it helps, what task it completes, and what makes it different from nearby pages. The title, main heading, introduction, internal links, and structured data should all support that same purpose.",
                    "A page about a free invoice generator should not use a title that promises accounting software, tax filing, or features the page does not provide. Accurate alignment builds trust and reduces disappointing clicks.",
                ],
            },
            {
                "heading": "Write a useful title element",
                "bullets": [
                    "Give every indexable page a distinct, descriptive title.",
                    "Place the main task or topic early when it reads naturally.",
                    "Add the brand when it helps recognition, but avoid repeating it several times.",
                    "Keep the title consistent with the visible heading and main content.",
                    "Avoid boilerplate titles that differ only by one word across hundreds of pages.",
                    "Do not claim ‘best’, ‘guaranteed’, or ‘official’ without evidence and authority.",
                ],
                "example": {
                    "title": "Clear title pattern",
                    "body": "Free Invoice Generator — Create and Save an Invoice | Ozzyl Tools is more descriptive than Home Page, Invoice Tool 2026 Best, or a long list of repeated keywords.",
                },
            },
            {
                "heading": "Create a meta description that earns the right click",
                "paragraphs": [
                    "Use one or two natural sentences to explain the page's practical value, important limitation, and expected action. A useful description can improve how a result is understood, but Google may generate a different snippet from visible page content when that better matches a query.",
                ],
                "bullets": [
                    "Describe the actual page, not the whole website.",
                    "Include a concrete benefit such as no sign-up, local processing, or export format only when true.",
                    "Avoid repeating the title word for word.",
                    "Do not use fabricated statistics, fake urgency, or ranking promises.",
                    "Make the opening page paragraph strong because it may also contribute to snippets.",
                ],
            },
            {
                "heading": "Choose and implement the canonical URL",
                "paragraphs": [
                    "A canonical URL is the preferred representative for a set of duplicate or very similar pages. Use an absolute URL, point indexable pages to the correct preferred version, and keep signals consistent across internal links, redirects, sitemaps, and canonical annotations.",
                ],
                "bullets": [
                    "Do not canonicalize every category page to the homepage.",
                    "Do not point a useful unique page to an unrelated URL.",
                    "Avoid canonical chains where page A points to B and B points to C.",
                    "Use redirects when a page has permanently moved and visitors should also go to the new URL.",
                    "Keep protocol, hostname, trailing slash, and parameter handling consistent.",
                ],
            },
            {
                "heading": "Social metadata and structured data",
                "paragraphs": [
                    "Open Graph and similar social metadata control how a shared link may be presented by compatible platforms. Use an accurate title, description, canonical page URL, and a properly licensed image that represents the page. Test previews rather than assuming every platform uses the same crop or cache.",
                    "Structured data should represent visible content and the main purpose of the page. Adding markup can help search systems understand content, but correct markup does not guarantee a special result. Prefer complete, accurate properties over a large amount of incomplete markup.",
                ],
            },
            {
                "heading": "Publish and verify",
                "steps": [
                    "Preview the title and description, then read them as a user rather than only checking character counts.",
                    "Inspect the rendered HTML to confirm tags appear once and contain the expected values.",
                    "Verify the canonical URL resolves successfully and is not blocked from indexing.",
                    "Check the page in Search Console URL Inspection after deployment.",
                    "Validate supported structured data with the Rich Results Test and generic schema with the Schema Markup Validator.",
                    "Monitor queries and click-through behavior, then improve misleading or unhelpful wording without changing the page purpose casually.",
                ],
            },
        ],
        "checklist": [
            "Title is unique, descriptive, and aligned with the visible heading.",
            "Description summarizes the actual page without unsupported claims.",
            "Canonical is absolute, correct, and consistent with internal links and sitemap.",
            "Robots directives do not accidentally block the page.",
            "Social preview values and image rights have been checked.",
            "Structured data matches visible content.",
            "The deployed URL has been inspected and validated.",
        ],
        "sources": [
            {
                "label": "Google Search Central: Title links",
                "url": "https://developers.google.com/search/docs/appearance/title-link",
            },
            {
                "label": "Google Search Central: Snippets and meta descriptions",
                "url": "https://developers.google.com/search/docs/appearance/snippet",
            },
            {
                "label": "Google Search Central: Canonical URLs",
                "url": "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls",
            },
            {
                "label": "Google Search Central: Structured data guidelines",
                "url": "https://developers.google.com/search/docs/appearance/structured-data/sd-policies",
            },
        ],
    },
    {
        "slug": "how-to-format-and-validate-json",
        "title": "How to Format and Validate JSON: Syntax, Errors, and Safe Workflow",
        "short_title": "Format and Validate JSON",
        "summary": (
            "Understand valid JSON syntax, fix common parsing errors, format or minify data, and "
            "review sensitive content before sharing it."
        ),
        "category": "Developer workflow",
        "reading_time": "8 min read",
        "published": "2026-07-18",
        "updated": "2026-07-18",
        "primary_tool": {
            "endpoint": "utility_tools.json_formatter",
            "values": {},
            "label": "Open JSON Formatter & Validator",
            "description": "Validate, format, minify, sort, inspect, copy, and download JSON locally.",
        },
        "related_tools": [
            {
                "endpoint": "utility_tools.csv_json_converter",
                "values": {},
                "label": "CSV & JSON Converter",
            },
            {
                "endpoint": "utility_tools.base64_tool",
                "values": {},
                "label": "Base64 Encoder & Decoder",
            },
            {"endpoint": "utility_tools.regex_tester", "values": {}, "label": "Regex Tester"},
        ],
        "context_tools": [
            {"endpoint": "utility_tools.json_formatter", "values": {}},
            {"endpoint": "utility_tools.csv_json_converter", "values": {}},
        ],
        "takeaways": [
            "JSON requires double-quoted property names and string values.",
            "Comments, trailing commas, undefined, functions, and unescaped control characters are not valid JSON.",
            "Formatting changes whitespace; it should not change the represented data.",
            "Validation confirms syntax, not whether values are truthful, safe, or appropriate for an API.",
        ],
        "sections": [
            {
                "heading": "What valid JSON can contain",
                "paragraphs": [
                    "JSON represents objects, arrays, strings, numbers, booleans, and null. An object contains name-value pairs inside braces, while an array contains ordered values inside brackets. Property names and strings use double quotes.",
                ],
                "example": {
                    "title": "Valid JSON example",
                    "body": '{"customer":{"name":"Amina","active":true},"items":[{"sku":"A-10","quantity":2}],"note":null}',
                },
                "bullets": [
                    "Objects use braces: { }",
                    "Arrays use brackets: [ ]",
                    "Names and string values use double quotes.",
                    "Values are separated by commas, but the final value has no trailing comma.",
                    "Whitespace is optional outside strings.",
                ],
            },
            {
                "heading": "Common parsing errors",
                "bullets": [
                    "Single quotes around property names or string values.",
                    "A trailing comma after the last object property or array item.",
                    "Missing commas, colons, braces, brackets, or closing quotes.",
                    "JavaScript comments such as // note or /* note */.",
                    "Unescaped line breaks, tabs, quotes, or backslashes inside a string.",
                    "Values such as undefined, NaN, Infinity, functions, dates, maps, or sets written as though JSON supports them directly.",
                    "Leading zeroes or other number formats outside JSON grammar.",
                ],
                "paragraphs": [
                    "When JSON.parse receives text that does not follow JSON grammar, it throws a SyntaxError. Error wording varies by engine, so use the reported position as a starting point and inspect nearby punctuation as well as the line immediately before it.",
                ],
            },
            {
                "heading": "A reliable validation workflow",
                "steps": [
                    "Copy the original text into a separate working file so you can recover from accidental edits.",
                    "Run syntax validation before formatting; do not assume pretty indentation proves validity.",
                    "Use the reported line and column to inspect quotes, commas, and closing delimiters.",
                    "Fix one structural error at a time and validate again because one missing quote can cause many later errors.",
                    "Format the valid result and review its hierarchy, array sizes, key names, and value types.",
                    "Compare important identifiers and amounts with the source system before using the data.",
                    "Minify only for transport or storage after the readable version has been approved.",
                ],
            },
            {
                "heading": "Formatting, minifying, and sorting keys",
                "paragraphs": [
                    "Pretty formatting adds indentation and line breaks so people can inspect nested data. Minification removes unnecessary whitespace to reduce size. Neither operation should change objects, arrays, strings, numbers, booleans, or null values.",
                    "Sorting object keys can make configuration files and reviews easier to compare, but key order should not be used as business meaning. Array order, on the other hand, is meaningful and must not be changed casually.",
                ],
                "note": "Serializing application objects to JSON may omit or transform unsupported values. Validate the produced JSON, but also verify that the application did not silently lose information before serialization.",
            },
            {
                "heading": "Privacy and security review",
                "paragraphs": [
                    "Valid JSON can still contain passwords, access tokens, session identifiers, private customer data, internal URLs, or secrets. Before pasting data into any online tool, determine whether processing occurs locally or on a remote server and remove fields that are not needed for the task.",
                ],
                "bullets": [
                    "Replace real tokens, passwords, API keys, cookies, and account numbers with safe placeholders.",
                    "Do not publish production configuration merely because it is valid JSON.",
                    "Treat decoded Base64 content as ordinary sensitive data; encoding is not encryption.",
                    "Validate data types and allowed fields on the receiving server even when a client already validated syntax.",
                    "Avoid evaluating JSON text as JavaScript code.",
                ],
            },
        ],
        "checklist": [
            "A backup of the original text exists.",
            "Syntax validation succeeds before formatting or minifying.",
            "Quotes, commas, delimiters, and escape sequences have been checked.",
            "Important values and types match the source system.",
            "Array order has not been changed unintentionally.",
            "Secrets and personal data have been removed before sharing.",
            "The receiving application still validates allowed fields and values.",
        ],
        "sources": [
            {
                "label": "MDN: JSON.parse()",
                "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse",
            },
            {
                "label": "MDN: JSON.stringify()",
                "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify",
            },
        ],
    },
]

GUIDES_BY_SLUG = {guide["slug"]: guide for guide in GUIDES}

__all__ = ["GUIDES", "GUIDES_BY_SLUG"]
