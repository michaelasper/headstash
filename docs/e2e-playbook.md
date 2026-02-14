# E2E Strategy and Maintenance Playbook

This document defines how Headstash E2E tests are structured, run locally, executed in CI, and maintained over time.

## Current E2E Architecture

- Runner: Playwright (`@playwright/test`)
- Config: `playwright.config.ts`
- Test roots:
  - `e2e/tests/smoke`
  - `e2e/tests/critical`
- Auth setup project:
  - `e2e/fixtures/auth.setup.ts`
  - persists storage state to `e2e/.auth/user.json`
- Main browser project:
  - Chromium project depends on setup project

### Web server boot strategy

Playwright starts the app with deterministic DB bootstrap:

```bash
npm run db:generate && npm run db:deploy && npm run db:seed && npm run dev
```

This avoids CI startup drift and ensures the Prisma client + schema + seed data are ready before tests run.

## Selector and wait policy

- Selector priority: `data-testid` > role > label
- Avoid brittle DOM/CSS selectors
- Do **not** use `waitForTimeout`
- Prefer explicit waits (`toBeVisible`, `toHaveURL`, response waits) and Playwright auto-waiting

## Local execution and debugging

### Install browser dependency

```bash
npm run e2e:install
```

### List discovered tests

```bash
npm run e2e:test -- --list
```

### Run all E2E tests

```bash
npm run e2e:test
```

### Run smoke-only check (CI parity)

```bash
npm run e2e:test -- --grep "home page renders key navigation"
```

### Run critical path suite

```bash
npm run e2e:test -- --project=chromium e2e/tests/critical/critical-path.spec.ts
```

### Debug in headed mode

```bash
npm run e2e:test:headed
```

### Focus a single test by title

```bash
npm run e2e:test -- --grep "login flow entry page renders credential controls"
```

## CI behavior

Workflow: `.github/workflows/e2e.yml`

- Trigger: push + PR to `main`
- Runtime: Ubuntu + Node 20
- Steps:
  1. `npm ci`
  2. `npm run e2e:install`
  3. `npm run e2e:test -- --grep "home page renders key navigation"`
- Artifacts:
  - Always upload `playwright-report/`
  - Upload `test-results/` on failures

## Flaky-test triage checklist

When an E2E test flakes or fails intermittently:

1. **Classify failure type**
   - startup/config issue
   - selector ambiguity
   - auth/storage-state issue
   - data/state race
   - infrastructure transient
2. **Reproduce locally with CI-like path**
   - run smoke grep command
   - run failing spec in Chromium project
3. **Inspect artifacts**
   - Playwright HTML report
   - `test-results` traces/screenshots
   - CI failed job logs
4. **Check deterministic preconditions**
   - Prisma generate/deploy/seed path executed
   - no stale server reuse assumptions
   - required env defaults present
5. **Fix toward determinism**
   - tighten selector scope (prefer role/name + container scoping)
   - remove hard waits
   - use explicit state assertions
6. **Re-verify**
   - rerun local target spec
   - rerun smoke grep
   - confirm PR checks pass in CI
7. **Document root cause and mitigation**
   - add/update report under `reports/`
   - reference commit and CI run links in task notes

## Ownership and update process

- Primary owner: `coding` agent (Mission Control E2E workstream)
- Reviewer: `manager`

Update this playbook when any of these change:

- Playwright project layout or auth setup flow
- webServer startup command/env strategy
- CI workflow execution scope (smoke vs full suite)
- artifact upload behavior
- selector/wait conventions

Required update steps for E2E-related PRs:

1. Update this file if architecture/process changed
2. Add validation evidence in task report under `reports/`
3. Link PR + report in Mission Control task before moving to review
