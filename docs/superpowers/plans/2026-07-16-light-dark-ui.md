# Light/Dark Theme and UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a complete, accessible light/dark theme with no initial flash, persistent user choice, system-preference fallback, and focused visual polish across the existing Flask UI.

**Architecture:** Extract theme behavior from the minified general-purpose `app.js` into a pure, independently tested `theme.js` module. The base template runs a minimal inline bootstrap before CSS rendering, while the module owns toggle behavior, persistence, system-change handling, button state, and browser theme color. CSS continues to be split between foundations (`app.css`) and product components (`components.css`) but uses one semantic token set and only `data-theme` selectors.

**Tech Stack:** Flask/Jinja, semantic HTML, CSS custom properties, ES modules, Node.js built-in test runner, pytest.

---

## File structure

- Create `app/static/js/theme.js` — pure theme resolution and DOM controller.
- Create `tests/js/theme.test.mjs` — theme resolution, persistence, control state, and system-change tests.
- Create `tests/test_theme_assets.py` — template/CSS contract tests.
- Modify `app/static/js/app.js` — import and initialize the theme controller; remove duplicate theme logic.
- Modify `app/templates/base.html` — deterministic no-flash bootstrap, accessible two-state toggle, dynamic theme-color hook.
- Modify `app/static/css/app.css` — semantic tokens, light/dark foundation, header/control polish.
- Modify `app/static/css/components.css` — token-driven cards/forms/results/document workspace and responsive polish.
- Modify `README.md` and `design-system/ozzyl-tools/MASTER.md` — document final theme behavior and token additions.

### Task 1: Define theme behavior through failing JavaScript tests

**Files:**
- Create: `tests/js/theme.test.mjs`
- Create later: `app/static/js/theme.js`

- [ ] **Step 1: Write pure resolution and controller tests**

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import {
  applyTheme,
  createThemeController,
  nextTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
} from "../../app/static/js/theme.js";

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

function createMedia(matches) {
  let listener = null;
  return {
    matches,
    addEventListener(type, callback) {
      if (type === "change") listener = callback;
    },
    removeEventListener(type, callback) {
      if (type === "change" && listener === callback) listener = null;
    },
    emit(nextMatches) {
      this.matches = nextMatches;
      listener?.({ matches: nextMatches });
    },
  };
}

function createButton() {
  const attributes = new Map();
  return {
    title: "",
    dataset: {},
    addEventListener(type, callback) {
      if (type === "click") this.click = callback;
    },
    removeEventListener() {},
    setAttribute(name, value) {
      attributes.set(name, value);
    },
    getAttribute(name) {
      return attributes.get(name);
    },
    click() {},
  };
}

test("saved theme wins over system preference", () => {
  assert.equal(resolveTheme("light", true), "light");
  assert.equal(resolveTheme("dark", false), "dark");
});

test("system preference is used when no valid theme is saved", () => {
  assert.equal(resolveTheme(null, true), "dark");
  assert.equal(resolveTheme("auto", false), "light");
});

test("nextTheme always returns the opposite explicit theme", () => {
  assert.equal(nextTheme("light"), "dark");
  assert.equal(nextTheme("dark"), "light");
});

test("applyTheme updates root, browser chrome, and accessible toggle state", () => {
  const root = { dataset: {}, style: {} };
  const meta = { content: "" };
  const button = createButton();

  applyTheme({ root, meta, button }, "dark");

  assert.equal(root.dataset.theme, "dark");
  assert.equal(root.style.colorScheme, "dark");
  assert.equal(meta.content, "#08111f");
  assert.equal(button.dataset.currentTheme, "dark");
  assert.equal(button.getAttribute("aria-label"), "Switch to light theme");
  assert.equal(button.getAttribute("aria-pressed"), "true");
});

test("controller persists an explicit choice after clicking", () => {
  const storage = createStorage();
  const media = createMedia(true);
  const root = { dataset: {}, style: {} };
  const meta = { content: "" };
  const button = createButton();

  createThemeController({ root, meta, button, storage, media });
  assert.equal(root.dataset.theme, "dark");

  button.click();

  assert.equal(root.dataset.theme, "light");
  assert.equal(storage.getItem(THEME_STORAGE_KEY), "light");
});

test("system changes apply only until the user chooses explicitly", () => {
  const storage = createStorage();
  const media = createMedia(false);
  const root = { dataset: {}, style: {} };
  const meta = { content: "" };
  const button = createButton();

  createThemeController({ root, meta, button, storage, media });
  media.emit(true);
  assert.equal(root.dataset.theme, "dark");

  button.click();
  assert.equal(root.dataset.theme, "light");

  media.emit(true);
  assert.equal(root.dataset.theme, "light");
});
```

- [ ] **Step 2: Run the focused Node tests and verify they fail because the module does not exist**

Run:

```bash
node --test tests/js/theme.test.mjs
```

Expected: failure with `ERR_MODULE_NOT_FOUND` for `app/static/js/theme.js`.

- [ ] **Step 3: Commit the red tests**

```bash
git add tests/js/theme.test.mjs
git commit -m "test: define light and dark theme behavior"
```

### Task 2: Implement the testable theme module

**Files:**
- Create: `app/static/js/theme.js`
- Modify: `app/static/js/app.js:1-9,21`
- Test: `tests/js/theme.test.mjs`

- [ ] **Step 1: Implement `theme.js`**

```javascript
export const THEME_STORAGE_KEY = "ozzyl-theme";

const THEMES = new Set(["light", "dark"]);
const THEME_COLORS = {
  light: "#f8fafc",
  dark: "#08111f",
};

function normalizeTheme(value) {
  return THEMES.has(value) ? value : null;
}

function readStoredTheme(storage) {
  try {
    return normalizeTheme(storage?.getItem(THEME_STORAGE_KEY));
  } catch {
    return null;
  }
}

function writeStoredTheme(storage, theme) {
  try {
    storage?.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The selected theme still applies for this page when storage is unavailable.
  }
}

export function resolveTheme(storedTheme, prefersDark) {
  return normalizeTheme(storedTheme) ?? (prefersDark ? "dark" : "light");
}

export function nextTheme(theme) {
  return theme === "dark" ? "light" : "dark";
}

export function applyTheme({ root, meta, button }, theme) {
  const resolved = normalizeTheme(theme) ?? "light";
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;

  if (meta) meta.content = THEME_COLORS[resolved];

  if (button) {
    const next = nextTheme(resolved);
    button.dataset.currentTheme = resolved;
    button.title = `Switch to ${next} theme`;
    button.setAttribute("aria-label", `Switch to ${next} theme`);
    button.setAttribute("aria-pressed", String(resolved === "dark"));
  }

  return resolved;
}

export function createThemeController({ root, meta, button, storage, media }) {
  let explicitTheme = readStoredTheme(storage);

  const render = (theme, persist = false) => {
    const resolved = applyTheme({ root, meta, button }, theme);
    if (persist) {
      explicitTheme = resolved;
      writeStoredTheme(storage, resolved);
    }
    return resolved;
  };

  render(resolveTheme(explicitTheme, media.matches));

  const handleClick = () => {
    render(nextTheme(root.dataset.theme), true);
  };

  const handleSystemChange = (event) => {
    if (!explicitTheme) render(event.matches ? "dark" : "light");
  };

  button?.addEventListener("click", handleClick);
  media.addEventListener?.("change", handleSystemChange);

  return () => {
    button?.removeEventListener("click", handleClick);
    media.removeEventListener?.("change", handleSystemChange);
  };
}

export function initTheme() {
  const button = document.querySelector("[data-theme-toggle]");
  if (!button) return null;

  return createThemeController({
    root: document.documentElement,
    meta: document.querySelector("[data-theme-color]"),
    button,
    storage: window.localStorage,
    media: window.matchMedia("(prefers-color-scheme: dark)"),
  });
}
```

- [ ] **Step 2: Replace the duplicate theme implementation in `app.js`**

Add at the top:

```javascript
import { initTheme } from "./theme.js";
```

Remove the old `initTheme()` function that cycles through `auto`, `light`, and `dark`. Keep the existing final initialization call:

```javascript
if (typeof document !== "undefined") {
  initTheme();
  initMenu();
  initFavorites();
  initRecentTools();
  initToolDiscovery();
  initReloadButtons();
  initPwa();
}
```

Do not change calculator, document, menu, favorite, search, toast, or PWA behavior in this task.

- [ ] **Step 3: Run theme and existing JavaScript tests**

Run:

```bash
node --test tests/js/theme.test.mjs
```

Expected: all theme tests pass.

Run:

```bash
node --test tests/js/*.test.mjs
```

Expected: calculator and theme tests all pass.

- [ ] **Step 4: Commit the theme controller**

```bash
git add app/static/js/theme.js app/static/js/app.js tests/js/theme.test.mjs
git commit -m "feat: add persistent light and dark theme controller"
```

### Task 3: Add no-flash template bootstrap and accessible toggle markup

**Files:**
- Create: `tests/test_theme_assets.py`
- Modify: `app/templates/base.html:3-23,47-51`
- Test: `tests/test_theme_assets.py`

- [ ] **Step 1: Write failing template and asset contract tests**

```python
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP_CSS = ROOT / "app" / "static" / "css" / "app.css"
COMPONENT_CSS = ROOT / "app" / "static" / "css" / "components.css"


def test_base_template_contains_no_flash_theme_bootstrap(client):
    html = client.get("/").get_data(as_text=True)

    assert 'data-theme="light"' in html
    assert "localStorage.getItem('ozzyl-theme')" in html
    assert "prefers-color-scheme: dark" in html
    assert "data-theme-color" in html


def test_theme_toggle_has_explicit_accessible_state(client):
    html = client.get("/").get_data(as_text=True)

    assert "data-theme-toggle" in html
    assert 'aria-pressed="false"' in html
    assert "theme-icon-sun" in html
    assert "theme-icon-moon" in html


def test_css_uses_one_data_theme_selector_and_semantic_tokens():
    css = APP_CSS.read_text() + COMPONENT_CSS.read_text()

    for token in (
        "--bg",
        "--surface",
        "--surface-elevated",
        "--text",
        "--muted",
        "--border",
        "--border-strong",
        "--focus-ring",
        "--shadow-card",
    ):
        assert token in css

    assert ':root[data-theme="dark"]' in css
    assert ".dark " not in css
    assert ":root.dark" not in css
```

- [ ] **Step 2: Run the template tests and verify they fail against the current markup/CSS contract**

Run:

```bash
PATH="$PWD/.venv/bin:$PATH" pytest tests/test_theme_assets.py -v
```

Expected: failures for initial `data-theme`, accessible toggle state/classes, missing extended tokens, and legacy `.dark` selectors.

- [ ] **Step 3: Update the initial HTML and browser theme-color hook**

Change the opening and theme-color metadata to:

```html
<html lang="{{ default_locale }}" data-theme="light">
```

```html
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#f8fafc" data-theme-color>
```

Replace the current inline theme script with:

```html
<script nonce="{{ g.csp_nonce }}">
  (function () {
    var saved = null;
    try {
      saved = localStorage.getItem('ozzyl-theme');
    } catch (error) {
      saved = null;
    }
    var prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = saved === 'light' || saved === 'dark'
      ? saved
      : (prefersDark ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }());
</script>
```

Place this nonce-bearing script immediately before the stylesheet links so the theme attribute is set before CSS paint. Keep the CSP nonce and do not add `unsafe-inline`.

- [ ] **Step 4: Update the theme toggle markup**

Replace the current theme button with:

```html
<button
  class="icon-button theme-toggle"
  type="button"
  data-theme-toggle
  aria-label="Switch to dark theme"
  aria-pressed="false"
>
  <span class="theme-icon theme-icon-sun">{{ icon('sun', 19) }}</span>
  <span class="theme-icon theme-icon-moon">{{ icon('moon', 19) }}</span>
</button>
```

- [ ] **Step 5: Run the template tests**

Run:

```bash
PATH="$PWD/.venv/bin:$PATH" pytest tests/test_theme_assets.py -v
```

Expected: markup assertions pass; CSS assertions remain red until Task 4.

- [ ] **Step 6: Commit the template contract**

```bash
git add app/templates/base.html tests/test_theme_assets.py
git commit -m "feat: add no-flash accessible theme markup"
```

### Task 4: Consolidate semantic tokens and improve foundations

**Files:**
- Modify: `app/static/css/app.css:1`
- Modify: `app/static/css/components.css:2`
- Test: `tests/test_theme_assets.py`

- [ ] **Step 1: Replace the root token block in `app.css`**

Use this semantic token set at the beginning of `app.css`:

```css
:root {
  color-scheme: light;
  --bg: #f8fafc;
  --bg-accent: #eef4ff;
  --surface: #ffffff;
  --surface-elevated: #ffffff;
  --surface-soft: #f1f5f9;
  --surface-translucent: rgb(248 250 252 / 88%);
  --text: #0f172a;
  --muted: #526078;
  --border: #d9e2ec;
  --border-strong: #b8c5d4;
  --primary: #2563eb;
  --primary-hover: #1d4ed8;
  --primary-soft: #eff6ff;
  --primary-border: #bfdbfe;
  --primary-gradient-end: #4f46e5;
  --accent: #0f766e;
  --success: #15803d;
  --danger: #b91c1c;
  --warning: #b45309;
  --warning-soft: #fffbeb;
  --on-primary: #ffffff;
  --focus-ring: rgb(37 99 235 / 38%);
  --shadow-card: 0 4px 16px rgb(15 23 42 / 7%);
  --shadow-elevated: 0 18px 48px rgb(15 23 42 / 12%);
  --radius-sm: 10px;
  --radius: 16px;
  --radius-lg: 24px;
  --transition-fast: 180ms ease;
  --container: 1180px;
  --header: 72px;
}

:root[data-theme="dark"] {
  color-scheme: dark;
  --bg: #08111f;
  --bg-accent: #0d1a2d;
  --surface: #101b2d;
  --surface-elevated: #142238;
  --surface-soft: #17243a;
  --surface-translucent: rgb(8 17 31 / 88%);
  --text: #f8fafc;
  --muted: #c1cede;
  --border: #2b3a52;
  --border-strong: #40516b;
  --primary: #60a5fa;
  --primary-hover: #93c5fd;
  --primary-soft: #142d50;
  --primary-border: #315f91;
  --primary-gradient-end: #818cf8;
  --accent: #5eead4;
  --success: #4ade80;
  --danger: #f87171;
  --warning: #fbbf24;
  --warning-soft: #3a2a0b;
  --on-primary: #07111f;
  --focus-ring: rgb(96 165 250 / 45%);
  --shadow-card: 0 6px 20px rgb(0 0 0 / 22%);
  --shadow-elevated: 0 20px 54px rgb(0 0 0 / 35%);
}
```

- [ ] **Step 2: Update foundational selectors to consume the tokens**

Use these exact replacements in `app.css`:

```css
body {
  margin: 0;
  min-width: 320px;
  min-height: 100dvh;
  background:
    radial-gradient(circle at 85% -10%, var(--bg-accent), transparent 34rem),
    var(--bg);
  color: var(--text);
  font: 16px/1.6 Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}

:focus-visible {
  outline: 3px solid var(--focus-ring);
  outline-offset: 3px;
}

.site-header {
  position: sticky;
  z-index: 40;
  top: 0;
  height: var(--header);
  border-bottom: 1px solid var(--border);
  background: var(--surface-translucent);
  box-shadow: 0 1px 0 rgb(15 23 42 / 3%);
  backdrop-filter: blur(16px);
}

.icon-button {
  display: inline-grid;
  width: 44px;
  height: 44px;
  padding: 0;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface-elevated);
  color: var(--muted);
  box-shadow: var(--shadow-card);
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast),
    background var(--transition-fast),
    transform var(--transition-fast);
}

.icon-button:hover {
  border-color: var(--primary);
  background: var(--primary-soft);
  color: var(--primary);
}

.theme-icon {
  grid-area: 1 / 1;
}

:root[data-theme="light"] .theme-icon-sun,
:root[data-theme="dark"] .theme-icon-moon {
  display: none;
}
```

Replace uses of `var(--soft)` with `var(--surface-soft)`, `var(--shadow)` with either `var(--shadow-card)` or `var(--shadow-elevated)`, and gradient endpoint `#4f46e5` with `var(--primary-gradient-end)`. Replace white text on primary actions with `var(--on-primary)` only where contrast remains correct; retain explicit white in document paper/print content where the paper design is intentionally theme-independent.

- [ ] **Step 3: Remove the legacy dark selector from `components.css`**

Delete:

```css
:root.dark,:root[data-theme=dark]{...}
```

All dark values now live in `app.css` under `:root[data-theme="dark"]`.

- [ ] **Step 4: Run CSS contract tests**

Run:

```bash
PATH="$PWD/.venv/bin:$PATH" pytest tests/test_theme_assets.py -v
```

Expected: all template and CSS contract tests pass.

- [ ] **Step 5: Commit the foundation theme**

```bash
git add app/static/css/app.css app/static/css/components.css tests/test_theme_assets.py
git commit -m "style: consolidate semantic light and dark tokens"
```

### Task 5: Apply focused UI/UX polish to cards, forms, results, and navigation

**Files:**
- Modify: `app/static/css/app.css`
- Modify: `app/static/css/components.css`
- Verify: `app/templates/home.html`
- Verify: `app/templates/calculator.html`
- Verify: `app/templates/document.html`

- [ ] **Step 1: Improve card hierarchy and interaction without layout shift**

Apply these component rules in `components.css`:

```css
.tool-card,
.document-card,
.benefit-grid article,
.calculator-card,
.result-card,
.prose-card,
.editor-section {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface-elevated);
  box-shadow: var(--shadow-card);
}

.tool-card {
  display: grid;
  min-height: 270px;
  align-content: space-between;
  padding: 24px;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast),
    transform var(--transition-fast);
}

.tool-card:hover {
  transform: translateY(-3px);
  border-color: var(--primary-border);
  box-shadow: var(--shadow-elevated);
}

.tool-card:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--focus-ring), var(--shadow-card);
}

.favorite-button[aria-pressed="true"] {
  border-color: var(--warning);
  background: var(--warning-soft);
  color: var(--warning);
}
```

- [ ] **Step 2: Improve form legibility and error/focus states**

Apply:

```css
.field-group input,
.field-group select,
.field-group textarea,
.currency-row select,
.color-control input {
  width: 100%;
  min-height: 48px;
  padding: 11px 13px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast),
    background var(--transition-fast);
}

.field-group input:hover,
.field-group select:hover,
.field-group textarea:hover,
.currency-row select:hover {
  border-color: var(--border-strong);
}

.field-group input:focus,
.field-group select:focus,
.field-group textarea:focus,
.currency-row select:focus {
  border-color: var(--primary);
  outline: 0;
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.field-group input::placeholder,
.field-group textarea::placeholder {
  color: color-mix(in srgb, var(--muted) 78%, transparent);
}

.field-error:not(:empty) {
  display: flex;
  align-items: center;
  min-height: 22px;
  color: var(--danger);
  font-weight: 650;
}
```

- [ ] **Step 3: Improve result and workspace visual grouping**

Apply:

```css
.primary-result {
  margin: 22px 0;
  padding: 24px;
  border: 1px solid color-mix(in srgb, var(--primary) 42%, transparent);
  border-radius: var(--radius);
  background: linear-gradient(135deg, var(--primary), var(--primary-gradient-end));
  box-shadow: 0 16px 34px color-mix(in srgb, var(--primary) 24%, transparent);
  color: var(--on-primary);
}

.result-list > div {
  display: flex;
  min-height: 58px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid var(--border);
}

.editor-section-title {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.appearance-panel,
.formula-note,
.logo-dropzone,
.line-item-row {
  background: var(--surface-soft);
}
```

Keep `.paper` explicitly white with dark text in both themes because it represents the printed document, not an application surface.

- [ ] **Step 4: Improve mobile density and prevent horizontal overflow**

Add to the existing mobile media rules:

```css
@media (max-width: 620px) {
  .header-actions {
    gap: 8px;
  }

  .quick-search-card,
  .calculator-card,
  .result-card,
  .prose-card,
  .editor-section {
    border-radius: 14px;
  }

  .document-toolbar .button,
  .toolbar-actions .button {
    flex: 1 1 160px;
  }

  .result-list > div {
    align-items: flex-start;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    padding-block: 10px;
  }
}
```

- [ ] **Step 5: Run automated checks after CSS changes**

Run:

```bash
PATH="$PWD/.venv/bin:$PATH" make check
```

Expected: all Python and JavaScript tests, lint, formatting, and compilation pass.

- [ ] **Step 6: Commit the focused UI polish**

```bash
git add app/static/css/app.css app/static/css/components.css
git commit -m "style: improve themed cards forms and responsive hierarchy"
```

### Task 6: Update documentation and perform final theme verification

**Files:**
- Modify: `README.md:24-35`
- Modify: `design-system/ozzyl-tools/MASTER.md:12-26,44-59`
- Verify: all theme files and routes.

- [ ] **Step 1: Update product quality documentation**

Change the README quality bullet to:

```markdown
- Persistent light/dark themes with system-preference fallback, accessible focus states, 44px interaction targets, and reduced-motion support
```

Add the new semantic token names to `design-system/ozzyl-tools/MASTER.md`: `surface-elevated`, `surface-soft`, `border-strong`, `focus-ring`, `shadow-card`, and `shadow-elevated`. Document that the theme toggle is two-state after the initial system-derived choice.

- [ ] **Step 2: Run complete automated verification**

Run:

```bash
PATH="$PWD/.venv/bin:$PATH" make check
```

Expected: all checks pass.

Run:

```bash
node --check app/static/js/theme.js
```

Expected: exit code 0.

Run:

```bash
PATH="$PWD/.venv/bin:$PATH" FLASK_ENV=testing SECRET_KEY=theme-check DATABASE_URL=sqlite:////tmp/ozzyl-theme-check.db pytest -q
```

Expected: all Python tests pass.

- [ ] **Step 3: Perform local visual and interaction review**

Run the application:

```bash
PATH="$PWD/.venv/bin:$PATH" FLASK_ENV=development SECRET_KEY=local-theme-review flask --app run:app run --port 5001
```

Review these URLs in both themes:

```text
http://127.0.0.1:5001/
http://127.0.0.1:5001/tools/profit-margin-calculator/
http://127.0.0.1:5001/documents/invoice-generator/
http://127.0.0.1:5001/privacy/
http://127.0.0.1:5001/does-not-exist/
```

At 375px, 768px, and desktop widths verify:

- No flash of the wrong theme on reload.
- Toggle icon, label, and `aria-pressed` update correctly.
- Saved choice survives reload.
- With storage cleared, system preference selects the initial theme.
- Keyboard focus is visible on navigation, controls, cards, and form fields.
- Text, borders, placeholders, disabled states, errors, and cards remain readable in both themes.
- No horizontal page scrolling occurs.
- Document paper remains white and printable in dark mode.
- Reduced-motion preference suppresses transitions.

- [ ] **Step 4: Commit documentation after review**

```bash
git add README.md design-system/ozzyl-tools/MASTER.md
git commit -m "docs: document the complete theme system"
```

- [ ] **Step 5: Review final scope before push**

Run:

```bash
git status --short
git diff --check
git log --oneline -8
```

Expected: only intended theme, deployment, test, documentation, and plan files are committed; `.mcp.json`, `.codex/`, and unrelated `.gitignore` changes remain uncommitted.
