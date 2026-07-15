# Ozzyl Tools

A Flask-native, mobile-first business utility and workflow website. The MVP ships with eight calculators plus browser-based invoice and quotation generators.

## Included tools

- Profit margin calculator
- Markup calculator
- Discount calculator
- Sales commission calculator
- VAT calculator
- Break-even calculator
- Loan payment calculator
- Overtime pay calculator
- Invoice generator
- Quotation generator

## Architecture

- Flask 3 application factory
- Blueprint-based routing
- Catalog-driven calculator pages
- Vanilla JavaScript for instant browser-side calculations
- Local storage for document drafts
- SEO metadata, JSON-LD, sitemap, and robots.txt
- Responsive and print-friendly CSS
- Pytest route coverage
- Docker and Render deployment configuration

The MVP intentionally does not require a database. A `DATABASE_URL` environment variable is reserved for a Neon pooled connection string when accounts, saved history, premium templates, or team workspaces are added.

## Local setup

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env
flask --app run:app run --debug
```

Open `http://localhost:5000`.

## Tests

```bash
pytest -q
```

## Docker

```bash
docker build -t ozzyl-tools .
docker run --rm -p 8000:8000 --env-file .env ozzyl-tools
```

## Production configuration

Set at least:

- `SECRET_KEY`
- `SITE_URL` to the final HTTPS origin
- `SITE_NAME` if the brand changes
- `CONTACT_EMAIL`

When Neon is introduced, use its pooled connection string for `DATABASE_URL` and never commit credentials.

## Next milestones

1. Add analytics and Search Console verification.
2. Add downloadable branded PDFs and logo upload.
3. Add multilingual URL structure and translations.
4. Add Neon-backed accounts, saved customers, items, invoices, and history.
5. Add premium plans, affiliate placements, and agency lead capture.
