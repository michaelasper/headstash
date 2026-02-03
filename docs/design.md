# Headstash UI Foundations — PR-A (Typography & Density)

This doc describes the **PR-A foundation layer** from Rook’s design review.

## Goals

- Tokenize typography / spacing / colors
- Reduce vertical whitespace (target: ~30–40% less)
- Ensure an always-visible focus indicator (`focus-visible`)
- Constrain long text to a readable measure (~68ch)

## Tokens

Tokens live in:

- `src/app/globals.css`

### Semantic colors

Use semantic tokens via Tailwind mappings (`@theme inline`):

- background/foreground/muted
- card/border/shadow
- primary/accent/danger/link
- focus/success/warning

### Typography

Type scale (px equivalents):

- 12 / 14 / 16 / 18 / 22 / 28

Line heights:

- Body: 1.55
- UI: 1.3
- Headings: 1.15

### Spacing

4px base; recommended steps:

- 8 / 12 / 16 / 20 / 24 / 32 / 40

### Measure

- `--measure: 68ch`

## Focus ring

Global focus ring:

- `:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }`

Components may add additional focus styles, but should not remove this.

## Usage rules

- Prefer semantic tokens (`border-border`, `bg-card`, etc.) in shared components.
- Avoid hard-coded hex colors in component classes.
