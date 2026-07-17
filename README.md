# Ozzyl Tools

A production-oriented, Flask-native platform for free business calculators, PDF tools, data and writing utilities, and document workflows. The public experience is English-first, mobile-first, local-first, privacy-conscious, and intentionally halal-friendly.

Production: `https://tools.online-bazar.top`

## Current product

### Business calculators

Profit margin, markup, discount, sales commission, VAT, break-even, overtime pay, ROI, cash runway, inventory reorder point, unit economics, customer lifetime value, ROAS, and related operational planning tools.

The public catalog intentionally excludes interest/usury, loan-payment, mortgage-interest, debt-interest, compound-return, CAGR, NPV, and IRR calculators.

### Utilities and PDF workflows

- Word Unscrambler and text utilities
- UTM campaign URL builder and QR code generator
- JSON formatting and validation
- CSV and JSON conversion
- Base64, UUID, timestamp, regex, password, and percentage utilities
- PDF merge, organize, convert, inspect, compare, sign, stamp, crop, resize, and markup workflows

### Document workflow

Invoice, quotation, receipt, and purchase-order generators with:

- Live A4 preview
- Logo upload and custom accent color
- Multiple currencies
- Per-line tax, discounts, shipping, and transparent fees
- Browser autosave
- JSON backup and restore
- Copy/share summary
- Print and browser PDF export

### Organic discovery foundation

- Unique titles, descriptions, canonical URLs, Open Graph, and Twitter metadata
- Organization, WebSite, CollectionPage, WebApplication, Breadcrumb, and FAQ structured data
- XML sitemap with review dates
- Search and AI crawler directives in `robots.txt`
- AI-readable `/llms.txt`
- Visible answer-first content, formulas, limitations, FAQs, and internal links
- Transparent About, Privacy, and Terms pages
- Project marketing context and an organic growth playbook under `.agents/` and `docs/marketing/`

Organic search performance and rankings cannot be guaranteed. The project avoids keyword stuffing, doorway pages, fake testimonials, fabricated statistics, link schemes, and paid-ad dependency.

### Product quality

- Flask application factory and modular blueprints
- SQLAlchemy 2 typed models
- Flask-Migrate / Alembic migrations committed to source control
- Neon/Psycopg 3 URL normalization
- CSP nonce for scripts, security headers, and secure production cookies
- Dark mode, accessible focus states, 44px interaction targets, reduced-motion support
- PWA manifest and offline fallback
- Non-root multi-stage Docker image
- GitHub Actions for Python, JavaScript, migrations, dependency audit, and Docker build

## Architecture

```text
app/
  config.py          environment and database URL normalization
  extensions.py      unbound SQLAlchemy and Migrate extensions
  models.py          future cloud/account/document domain model
  catalog.py         source calculator and document metadata
  halal_catalog.py   public catalog allowlist/filter
  routes.py          public, SEO, PWA, health and readiness routes
  templates/         server-rendered accessible UI
  static/            design system, browser logic, PWA assets
docs/marketing/      organic growth strategy
.agents/              product marketing context for Marketing Skills
migrations/          reviewed Alembic history
tests/               route, model, config and JavaScript tests
```

The calculators and document drafts work without a cloud database. When `DATABASE_URL` is empty, development uses `instance/ozzyl_tools.db`. Once a Neon URL is supplied, the same app uses PostgreSQL through Psycopg 3.

## Marketing Skills workflow

The project is configured to use the skills from `coreyhaines31/marketingskills` for organic SEO, content strategy, schema, launch planning, and product-marketing context.

```bash
npx skills add coreyhaines31/marketingskills
```

Project-specific rules are in `AGENTS.md`, product positioning is in `.agents/product-marketing-context.md`, and the execution plan is in `docs/marketing/organic-growth-plan.md`.

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

SEO endpoints:

- `/sitemap.xml`
- `/robots.txt`
- `/llms.txt`

## Deployment

GitHub Actions runs linting, Python and JavaScript tests, migration checks, dependency auditing, and a production Docker build. A commit on `main` is marked deploy-ready only after both test and Docker jobs pass.

The production VPS uses a pull-based watcher instead of storing an SSH private key in GitHub. Every three minutes it checks the latest successful `main` workflow, confirms the verified SHA still matches `origin/main`, and deploys that exact commit with migration, local/public health checks, and code rollback.

Production paths:

- Repository: `/opt/ozzyl-tools`
- Environment file: `/etc/ozzyl-tools/app.env`
- Persistent Docker volume: `ozzyl-tools-instance`
- Public origin: `https://tools.online-bazar.top`
- Watcher: `/usr/local/lib/ozzyl-tools/deploy-watch.sh`

The systemd files are committed in `ops/`. Install them with:

```bash
sudo cp ops/ozzyl-tools-deploy-watch.* /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now ozzyl-tools-deploy-watch.timer
```

The same Docker image can run on Render, Railway, Fly.io, or another container host. Configure `FLASK_ENV`, `SECRET_KEY`, `SITE_URL`, `CONTACT_EMAIL`, and `DATABASE_URL` as required.

## Planned cloud phase

The schema supports users, workspaces, memberships, customers, reusable items, documents, and document lines. A future cloud phase can add authentication, saved history, team workspaces, premium branding, and subscriptions without redesigning the core schema. Any monetization must remain transparent, privacy-conscious, and free from interest/usury, gambling, deceptive schemes, or other clearly prohibited functionality.
