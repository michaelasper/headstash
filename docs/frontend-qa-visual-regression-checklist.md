# Frontend QA + Visual Regression Checklist

Use this checklist before merging significant UI work (new components, redesigns, spacing/typography changes, interaction updates).

## Coverage matrix

- Viewports: `390x844`, `768x1024`, `1366x768`, `1920x1080`
- Themes: light, dark
- States: default, hover, focus-visible, active, disabled, loading, empty, error

## Screen groups

1. App shell (header/sidebar/nav/footer)
2. Dashboard/home (`/me`)
3. Feed + post detail (`/posts`, `/posts/[id]`)
4. Profile surfaces (`/profile`, `/u/[handle]`)
5. Forms/settings/auth (`/auth/signin`, onboarding/settings flows)
6. Modals/dialogs/overlays (if present in scope)

## Visual checks

- [ ] Spacing rhythm follows token scale
- [ ] Typography scale and line-height are consistent
- [ ] Color contrast meets accessibility targets
- [ ] Borders/radii/elevation match design system
- [ ] No clipping/overflow at breakpoint edges

## Interaction checks

- [ ] Keyboard-only navigation path is complete
- [ ] Focus states are visible and consistent
- [ ] Hover/active states are not color-only dependent
- [ ] Loading states avoid layout shift
- [ ] Reduced-motion preference is respected

## Component regression list

- [ ] Buttons (all variants/sizes/states)
- [ ] Inputs/selects/textareas (valid/invalid/help/error)
- [ ] Cards (default/interactive/elevated)
- [ ] Dialogs (focus trap + escape close)
- [ ] Tables/lists (dense/comfortable, empty state)

## Data state checks

- [ ] Empty state copy + CTA quality
- [ ] Error boundary visibility and actionability
- [ ] Slow-network loading placeholders
- [ ] Long-content truncation/wrapping behavior

## Release gate

- [ ] Baseline screenshots captured for key screens
- [ ] Diff threshold documented (manual or tool-based)
- [ ] High-severity regressions fixed before merge
- [ ] QA sign-off captured in PR notes

## Validation command set

Run this baseline command pair for social/feed/profile/dashboard surfaces:

```bash
npm run lint -- src/app/posts/page.tsx 'src/app/posts/[id]/page.tsx' src/app/profile/page.tsx src/app/me/page.tsx
npm run e2e:test -- --list
```

Expected outcome:

- Lint passes for touched route files
- Playwright suite discovery succeeds and lists setup/smoke/critical specs
