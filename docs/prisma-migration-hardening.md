# Prisma Migration Hardening Checklist

Use this checklist whenever introducing or deploying Prisma schema changes.

## Objective
Reduce migration risk across development, CI, and production deploys.

## Command policy
- Dev only: `prisma migrate dev`
- Production/staging deploy: `prisma migrate deploy`
- Never use `prisma migrate dev` in production.

## Preflight (before creating/applying migration)
- [ ] `prisma validate` passes
- [ ] `prisma format` run
- [ ] Review schema diff for destructive changes
- [ ] Confirm backup/snapshot strategy for production DB
- [ ] Ensure migration name clearly describes intent

## CI checks
- [ ] Migration files committed
- [ ] Fresh database apply test passes
- [ ] Build/test suite passes after migration
- [ ] Smoke query checks for touched tables

## Deploy checklist
- [ ] Release notes include migration impact
- [ ] Run `prisma migrate deploy`
- [ ] Capture migration output in deploy logs
- [ ] Post-deploy smoke checks for critical flows

## Rollback / incident handling
- [ ] If migration fails, use `prisma migrate resolve` with clear runbook notes
- [ ] Restore from backup when data integrity is at risk
- [ ] Create follow-up corrective migration instead of ad-hoc DB edits
- [ ] Document incident timeline in ops notes

## Drift prevention
- [ ] Disallow manual schema edits in production without migration artifacts
- [ ] Periodically run migration status checks in CI/CD
- [ ] Keep environment parity for provider/version where possible

## Suggested acceptance checks
- Feed read path works
- Notifications read/write works
- Auth session/account writes work
- Profile update persists correctly
