# Ozzyl Tools Design System

This file is the visual source of truth for the product. It follows the UI/UX Pro Max workflow for a **business productivity tool**: Flat Design + Micro-interactions, Minimalism as the secondary style, an interactive product-demo landing pattern, clear hierarchy, and functional colors.

## Product character

- Trustworthy, calm, fast, practical, global-ready.
- Utility over decoration. One primary action per screen.
- No emoji as structural icons. Use the single consistent 1.8px outline SVG language in `macros.html`.
- Motion is restrained and functional: 160–240ms, transform/opacity only, disabled for reduced-motion users.

## Semantic tokens

| Role | Light | Dark | Usage |
|---|---|---|---|
| Background | `#F8FAFC` | `#08111F` | Page canvas |
| Surface | `#FFFFFF` | `#101B2D` | Cards and menus |
| Primary | `#2563EB` | `#60A5FA` | Primary CTA and links |
| Accent | `#0F766E` | `#5EEAD4` | Privacy and supporting signals |
| Text | `#0F172A` | `#F8FAFC` | Primary content |
| Muted text | `#526078` | `#C1CEDE` | Body/supporting text |
| Border | `#D9E2EC` | `#2B3A52` | Dividers and outlines |
| Success | `#15803D` | `#4ADE80` | Completed/saved state |
| Danger | `#B91C1C` | `#F87171` | Errors/destructive action |

All implementation must use semantic CSS custom properties. Custom document accent color is the only user-controlled exception.

## Typography

- System UI sans-serif stack for speed, language coverage, and zero font-loading layout shift.
- Base body: 16px minimum; line-height 1.6.
- Headings: 600–800 weight, compact line-height, controlled letter spacing.
- Prices and metrics: tabular figures.
- Long-form text measure: 65–75 characters.

## Layout

- Mobile-first breakpoints: 620 / 820 / 1024px.
- Desktop content max width: 1180px.
- 4/8px spacing rhythm with section tiers 16 / 24 / 32 / 48 / 64 / 112.
- Interactive targets are at least 44×44px with at least 8px spacing.
- No horizontal page scrolling; document tables can scroll inside their bounded region on small screens.

## Components

- Buttons: primary solid blue, secondary bordered surface, ghost for low-emphasis actions.
- Cards: 14–20px radius, one consistent elevation scale, clear hover/pressed state without layout jitter.
- Forms: visible labels, helper/error region near field, 46px minimum input height, validation after interaction.
- Calculator results: one emphasized primary metric and a quieter supporting list.
- Document workflow: progressive four-step form, autosave feedback, edit/preview switch on mobile.

## Accessibility and quality gates

- Normal text contrast ≥4.5:1; large UI and icons ≥3:1.
- Visible 3px focus ring; never remove outline without replacement.
- Logical heading hierarchy, skip link, keyboard navigation, ARIA state on filters/favorites/tabs.
- Do not convey status using color alone.
- Respect `prefers-reduced-motion` and system color scheme.
- Test at 375px, tablet portrait, desktop, and landscape.
