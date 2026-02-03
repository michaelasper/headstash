# Headstash UI Foundations (v0)

This doc captures the **small design-system foundation** for Headstash.

## Goals

- Consistent typography + spacing + colors
- Semantic tokens (components consume tokens, not raw hex)
- Always-visible focus indicator (a11y)

## Where tokens live

- `src/app/globals.css`

## Semantic color tokens

Use these semantic tokens instead of hard-coded colors:

- `--bg` / `--fg`
- `--muted`
- `--card`
- `--border`
- `--shadow`

- `--primary`
- `--accent`
- `--danger`
- `--link`
- `--focus`
- `--success`
- `--warning`

These are mapped into Tailwind via `@theme` as:

- `bg-background`, `text-foreground`
- `text-muted`, `bg-card`, `border-border`
- `text-primary`, `text-link`, `outline-focus`, etc.

## Typography

Type scale (Rook):

- 12 / 14 / 16 / 18 / 20 / 24 / 28 (px equivalents)

Line heights:

- Body: `1.55`
- UI: `1.3`
- Headings: `1.15`

## Spacing

4px base. Recommended step tokens:

- 8 / 12 / 16 / 20 / 24 / 32 / 40

## Focus ring

All interactive controls should use `focus-visible` styling.

Standard:

- `focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2`

## Tap targets

Primary actions should be at least **44px** tall.

When using text links as nav items, add padding (e.g. `py-3`) or convert to buttons.

## Notes

- `prefers-reduced-motion` is respected in global CSS.
- Dark mode tokens are set via `prefers-color-scheme: dark`.
