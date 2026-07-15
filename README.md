# Ozzyl Tools

A production-oriented, Flask-native business utility and workflow platform. The public experience is English-first, mobile-first, local-first, and designed to expand into multilingual pages and a Neon-backed SaaS.

## Current product

### Business calculators

Profit margin, markup, discount, sales commission, VAT, break-even, loan payment, overtime pay, ROI, cash runway, inventory reorder point, compound growth, and unit economics.

### Document workflow

Invoice, quotation, receipt, and purchase-order generators with:

- Live A4 preview
- Logo upload and custom accent color
- Multiple currencies
- Per-line tax, discounts, shipping, and fees
- Browser autosave
- JSON backup and restore
- Copy/share summary
- Print and browser PDF export

### Product quality

- Flask application factory and blueprints
- SQLAlchemy 2 typed models
- Flask-Migrate / Alembic migrations committed to source control
- Neon/Psycopg 3 URL normalization
- CSP nonce for scripts, security headers, and secure production cookies
- Dark mode, accessible focus states, 44px interaction targets, reduced-motion support
- PWA manifest and offline fallback
- Sitemap, robots, canonical metadata, Open Graph, and JSON-LD
- Non-root multi-stage Docker image
- GitHub Actions for Python, JavaScript, migrations, dependency audit, and Docker build

## Architecture

```text
app/
  config.py       environment and database URL normalization
  extensions.py   unbound SQLAlchemy and Migrate extensions
  models.py       future cloud/account/document domain model
  catalog.py      calculator and document metadata
  routes.py       public, SEO, PWA, health and readiness routes
  templates/      server-rendered accessible UI
  static/         design system, browser logic, PWA assets
migrations/       reviewed Alembic history
tests/            route, model, config and JavaScript calculation tests
```

The calculators and document drafts work without a cloud database. When `DATABASE_URL` is empty, development uses `instance/ozzyl_tools.db`. Once a Neon URL is supplied, the same app uses PostgreSQL through Psycopg 3.

## Local setup

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env
flask --app run:app db upgrade
flask --app run:app run --debug
```

Open `http://localhost:5000`.

## Add Neon later

1. Copy the **pooled** Neon connection string.
2. Set it as `DATABASE_URL` without committing `.env`.
3. Run:

```bash
flask --app run:app db upgrade
flask --app run:app db current
```

Both `postgres://...` and `postgresql://...` are normalized to the SQLAlchemy Psycopg 3 dialect.

## Quality checks

```bash
make check
```

Individual commands:

```bash
ruff check .
ruff format --check .
pytest --cov=app
node --test tests/js/*.test.mjs
flask --app run:app db check
```

## Docker

```bash
cp .env.example .env
# Set a secure SECRET_KEY before production use.
docker compose up --build
```

Health endpoints:

- `/health/` — application process
- `/ready/` — database connectivity

## Deployment

`render.yaml` is included. The same Docker image can run on a VPS, Render, Railway, Fly.io, or another container host. In production configure:

- `FLASK_ENV=production`
- `SECRET_KEY`
- `SITE_URL` with the final HTTPS origin
- `CONTACT_EMAIL`
- `DATABASE_URL` when cloud persistence is enabled

Apply migrations as a release step before routing production traffic.

## Planned cloud phase

The schema already supports users, workspaces, memberships, customers, reusable items, documents, and document lines. The next cloud phase can add authentication, saved history, team workspaces, premium branding, and subscriptions without redesigning the core schema.
