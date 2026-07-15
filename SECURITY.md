# Security Policy

Please do not open a public issue for a suspected vulnerability. Send a concise report to the address configured as `CONTACT_EMAIL`, including affected route, reproduction steps, and impact.

## Supported version

Security fixes are applied to the current `main` branch.

## Secrets

- Never commit `.env`, Neon credentials, API keys, session secrets, or customer data.
- Use the Neon pooled connection string in `DATABASE_URL`.
- Rotate a credential immediately if it appears in Git history or logs.
