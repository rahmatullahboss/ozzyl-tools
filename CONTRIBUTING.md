# Contributing

1. Create a focused feature branch from `main`.
2. Keep business logic, templates, styles, migrations, and tests in their existing layers.
3. Do not add a database table when an existing domain model can be extended cleanly.
4. Run `make check` before opening a pull request.
5. For model changes, generate and review a migration; never use `db.create_all()` as a production migration strategy.
6. Preserve accessibility: visible labels, keyboard access, 44px targets, semantic SVG icons, and reduced-motion support.
7. Update `design-system/ozzyl-tools/MASTER.md` before introducing a new visual pattern or token.
