# Headstash Design Tokens (v0)

This is a small foundation layer meant to keep UI consistent and accessible.

## Tokens live in

- `src/app/globals.css`

## Color tokens (semantic)

Components should consume **semantic tokens** rather than raw hex values:

- `--bg` / `--fg`
- `--muted`
- `--card`
- `--border`
- `--primary`
- `--link`
- `--danger`
- `--focus`

Tailwind v4 maps these through `@theme` to `background/foreground/muted/card/border/primary/link/danger/focus`.

## Typography + spacing guidance

- Type scale (Rook): 12/14/16/18/20/24/28
- Line heights: body 1.55, UI 1.3, headings 1.15
- Spacing base: 4px (recommended tokens: 8/12/16/20/24/32/40)

## Focus ring

All interactive controls should show a visible focus indicator.

This repo uses Tailwind `focus-visible:outline` classes with `outline-focus` (semantic focus token).

## Notes

- Dark mode tokens are defined via `prefers-color-scheme: dark`.
- `prefers-reduced-motion` is respected (animations/transitions minimized).
