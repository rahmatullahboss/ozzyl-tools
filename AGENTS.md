# Ozzyl Tools Agent Instructions

## Product

- Repository: `rahmatullahboss/ozzyl-tools`
- Production: `https://tools.online-bazar.top/`
- Primary strategy: organic discovery and repeat usage; do not introduce paid-ad dependency unless the owner explicitly requests it.

## Marketing Skills

Use the installed `coreyhaines31/marketingskills` capabilities when relevant, especially:

- `product-marketing-context`
- `ai-seo`
- `content-strategy`
- `programmatic-seo`
- `schema-markup`
- `seo-audit`
- `launch-strategy`

Read `.agents/product-marketing-context.md` before marketing or positioning work. Update that file when product positioning materially changes.

## Organic marketing rules

- Build useful pages and tools, not keyword-only pages.
- Use one stable canonical URL, a unique title, description, H1, visible explanation, internal links, and accurate structured data for every indexable page.
- Keep `sitemap.xml`, `robots.txt`, and `llms.txt` aligned with the public catalog.
- Prefer primary sources when laws, tax rules, standards, or current facts are involved.
- Never fabricate rankings, traffic, customer numbers, testimonials, accuracy rates, or performance claims.
- Never promise first-page rankings or “100% SEO.” Organic performance depends on competition, authority, indexing, quality, and time.
- Avoid keyword stuffing, doorway pages, copied content, mass-generated thin pages, link schemes, and spammy community promotion.

## Halal and ethical scope

Do not publish or restore tools or content that calculates, promotes, or facilitates:

- interest or usury (riba)
- loan interest, APR, mortgage interest, debt interest, or compound interest/return projections
- NPV, IRR, or discounted cash-flow tools based on interest-style discounting
- gambling, betting, lotteries, adult content, intoxicants, deceptive schemes, or clearly unlawful activity

Safe business arithmetic includes pricing, profit, VAT, payroll, inventory, operational ROI, customer economics, document workflows, PDF/data utilities, and other transparent service or trading calculations. When uncertain, keep the feature unpublished until its scope is reviewed.

## Engineering workflow

- Preserve unrelated tools and user changes.
- Work on a branch and open a pull request for material changes.
- Add tests for public routes, removed routes, sitemap exclusions, and structured-data rendering.
- Run Python tests, JavaScript tests, lint, migration checks, and the production build when available.
- Do not commit secrets, local MCP configuration, environment files, or credentials.
