# VPS CI/CD and Light/Dark Theme Design

## Summary

This change adds two independent but coordinated improvements to Ozzyl Tools:

1. A production-safe GitHub Actions deployment pipeline that deploys the exact tested commit to the existing VPS after all CI checks pass.
2. A semantic light/dark theme system with a persistent user preference and targeted UI polish across the current Flask templates and static assets.

The existing Flask, Docker Compose, Gunicorn, and server-side rendering architecture remains unchanged. No new frontend framework or deployment platform is introduced.

## Goals

- Deploy automatically to the VPS whenever a push to `main` passes all required tests and Docker build checks.
- Prevent overlapping deployments.
- Verify application health after deployment.
- Roll back to the previous working commit when deployment or health verification fails.
- Keep production secrets outside the repository.
- Add a complete light theme without degrading the current dark theme.
- Respect system color preference on first visit and persist a user-selected preference.
- Improve contrast, focus states, interaction feedback, spacing consistency, and responsive behavior.

## Non-Goals

- Replacing Docker Compose with Kubernetes, Swarm, or another orchestrator.
- Publishing images to GHCR in this iteration.
- Redesigning the product information architecture or introducing a new JavaScript framework.
- Managing Cloudflare DNS or VPS firewall rules from GitHub Actions.
- Rotating existing VPS credentials automatically.

## Deployment Architecture

### Trigger and dependency chain

The existing CI workflow remains the source of truth for validation. On pushes to `main`:

1. Python lint, formatting, compilation, tests, coverage, migration checks, and dependency audit run.
2. JavaScript syntax and unit tests run.
3. The production Docker image is built.
4. A deploy job starts only after all required CI jobs succeed.

The deploy job uses GitHub Actions concurrency so only one production deployment can run at a time. A newer deployment cancels an older queued or in-progress deployment for the same production environment.

### Authentication and secrets

The repository will reference the following GitHub Actions secrets:

- `VPS_HOST` — production host, currently `103.72.65.220`
- `VPS_USER` — SSH user, currently `root`
- `VPS_PORT` — SSH port, normally `22`
- `VPS_SSH_KEY` — private deployment key dedicated to GitHub Actions
- `VPS_APP_DIR` — absolute path of the checked-out project on the VPS
- `PRODUCTION_URL` — public HTTPS origin used for the external health check

The workflow will not contain passwords, private keys, `.env` contents, or application secrets.

A dedicated SSH deployment key is preferred over reusing a personal private key. The corresponding public key must exist in the VPS user's `authorized_keys` file.

### Deployment sequence

The GitHub Actions deploy job connects to the VPS and runs a repository-owned deployment script. The script performs these steps:

1. Acquire a server-side deployment lock.
2. Confirm that `VPS_APP_DIR` is a Git repository with the expected remote.
3. Store the currently deployed commit as the rollback target.
4. Fetch the latest repository state from GitHub.
5. Checkout the exact commit identified by `GITHUB_SHA`, not an unverified moving branch tip.
6. Build the Docker Compose service using the new source.
7. Run database migrations with the newly built image and the production environment.
8. Recreate the web service using Docker Compose.
9. Poll the local health endpoint until it succeeds or the configured timeout expires.
10. Verify the public HTTPS health endpoint from GitHub Actions.
11. Record the deployed commit and completion time in the deployment log.

### Rollback behavior

If image build, migration, container startup, or local health verification fails:

1. The deployment script checks out the previous commit.
2. It rebuilds and recreates the previous service.
3. It verifies the local health endpoint again.
4. It exits with failure so the GitHub Actions run is visibly marked unsuccessful.

The rollback is code-level. Persistent database rollback is not automatic because destructive database downgrades can cause data loss. Therefore migrations introduced in this project must remain backward compatible for at least one release whenever practical.

### Server assumptions

The VPS must already have:

- Git
- Docker Engine
- Docker Compose v2
- A checked-out copy of the repository at `VPS_APP_DIR`
- A production `.env` file stored on the VPS and excluded from Git
- Existing reverse proxy and TLS configuration
- SSH access for the configured deployment user

The workflow will deploy the application but will not replace the current Nginx, Caddy, or Cloudflare setup.

## Theme Architecture

### Semantic tokens

The current visual styles will be refactored around semantic CSS custom properties rather than page-specific dark colors. Token groups include:

- Page background
- Primary, secondary, and elevated surfaces
- Primary and muted text
- Borders and dividers
- Primary brand action
- Success, warning, and error states
- Focus ring
- Shadows and overlays

Default values define the light theme. Dark values are applied through `html[data-theme="dark"]`. Light values may also be explicitly selected through `html[data-theme="light"]`.

Components consume semantic tokens only. Both themes therefore share the same component structure and interaction behavior.

### Theme selection rules

Theme resolution follows this order:

1. A saved user choice in `localStorage`.
2. The operating system preference from `prefers-color-scheme`.
3. Light mode as the final fallback.

A small inline script in the document head applies the resolved theme before the main stylesheet renders. This prevents a visible flash of the wrong theme.

The theme toggle:

- Appears in the primary header.
- Uses consistent SVG sun and moon icons.
- Has an accessible label describing the resulting action.
- Meets a minimum 44×44 px interaction target.
- Updates `aria-pressed` or equivalent state.
- Saves the user's explicit choice.

If the user has not explicitly selected a theme, operating system theme changes continue to be respected during the session.

## UI/UX Improvements

The UI update remains focused and does not restructure the application.

### Accessibility

- Maintain at least WCAG AA contrast for body text in both themes.
- Add visible keyboard focus rings to links, buttons, inputs, and interactive cards.
- Preserve semantic labels for forms.
- Ensure icon-only controls have accessible names.
- Respect `prefers-reduced-motion`.
- Avoid using color alone to communicate status.

### Interaction and component quality

- Use consistent hover, active, disabled, and focus states.
- Keep transitions between 150 and 250 ms and limit them to opacity, color, border, shadow, and transform.
- Standardize button height, radius, spacing, and loading behavior.
- Improve input contrast and placeholder readability.
- Use tabular number styling where financial values are displayed.
- Keep all primary touch targets at least 44 px high.

### Layout and visual hierarchy

- Establish a consistent spacing scale based on 4 px and 8 px increments.
- Improve card separation in light mode using borders and restrained elevation rather than excessive transparency.
- Keep readable content widths and prevent mobile horizontal overflow.
- Improve header alignment and spacing around the theme control.
- Refine calculator and document panels so labels, fields, actions, and results have clearer grouping.
- Preserve the current product identity and restrained tool-focused aesthetic.

## Files and Components Expected to Change

The implementation is expected to touch:

- `.github/workflows/ci.yml` or a dedicated production deploy workflow
- `scripts/deploy-vps.sh` or an equivalent repository-owned script
- Deployment documentation and example secret configuration
- Main base template for early theme initialization and the theme toggle
- Main stylesheet containing semantic theme tokens and component refinements
- Main JavaScript entrypoint for theme state and accessibility behavior
- JavaScript and Flask tests covering theme markup, theme resolution helpers, and deploy-script assumptions where practical

Exact paths may vary after implementation inspection, but responsibilities remain separated between workflow, deployment script, templates, CSS, and JavaScript.

## Error Handling and Observability

- Every remote deployment command runs with strict shell error handling.
- The workflow logs the target commit without printing secrets.
- Health polling has a finite timeout and clear failure output.
- Docker Compose service status and recent application logs are printed when health checks fail.
- Rollback success or failure is reported separately.
- GitHub Actions production environment records deployment history.
- A failed deployment never reports success merely because SSH completed.

## Testing and Verification

Before changes are pushed:

- Existing Python and JavaScript tests must pass.
- Ruff lint and format checks must pass.
- Docker image build must pass.
- Migration upgrade and schema consistency checks must pass.
- Theme JavaScript tests must cover saved preference, system fallback, explicit toggle, and persistence.
- Template tests must verify the theme control and early initialization hook are present.
- Both themes must be manually reviewed at mobile and desktop widths.
- Keyboard focus and reduced-motion behavior must be checked.

After deployment workflow setup:

- A non-production dry run validates SSH, repository path, Docker Compose availability, and health URL without changing the running release where possible.
- The first production deployment is monitored through GitHub Actions.
- The workflow verifies both the VPS-local health endpoint and the public Cloudflare-backed HTTPS health endpoint.

## Release Plan

1. Implement and test theme tokens, toggle behavior, and focused UI refinements locally.
2. Add the VPS deployment script and workflow dependency chain.
3. Document the required GitHub secrets and one-time VPS preparation.
4. Push changes to `main` after local verification.
5. Configure repository secrets in GitHub.
6. Run the first automated deployment and confirm the public health endpoint.
7. Keep the current manual deployment process available until one successful automated deployment and one rollback rehearsal are completed.

## Acceptance Criteria

- A push to `main` cannot deploy unless all required CI jobs pass.
- The VPS runs the exact tested `GITHUB_SHA`.
- Concurrent production deployments are prevented.
- A failed application health check triggers code rollback and a failed GitHub Actions result.
- No production credentials are committed to Git.
- The site supports complete light and dark themes.
- Initial theme selection respects saved choice and system preference without a visible theme flash.
- Theme preference persists across page loads.
- The theme toggle is keyboard accessible and clearly labeled.
- Existing calculators, document flows, tests, and responsive layouts continue to work.
- Both themes provide readable contrast, visible focus states, and consistent component hierarchy.
