# Deployment Runbook (Headstash)

Task: `fd551fc9-d3f7-47ce-a05b-6c8795ca58cd`
Owner: DevOps
Last updated: 2026-02-14

## Scope
This runbook covers the first production cutover for Headstash using a staging-first release process with explicit smoke checks and rollback controls.

## Release Roles
- **Release Commander:** Owns go/no-go and timeline
- **Deployer:** Executes CI/CD + runtime commands
- **Observer:** Verifies monitoring, logs, and error rates
- **Incident Lead:** Coordinates if rollback/escalation is triggered

## Severity Matrix
- **SEV-1:** Total outage, auth failure for all users, data loss risk → immediate rollback + incident bridge
- **SEV-2:** Major user flow broken (post/feed/write), sustained elevated 5xx → rollback unless fix < 15m
- **SEV-3:** Non-critical degradation/UI defects → continue with hotfix plan

## Pre-Deploy Checklist (T-24h to T-15m)
1. Confirm latest `main` is green:
   - required CI checks pass
   - no unresolved blocking incidents
2. Verify migrations:
   - migration reviewed
   - backup snapshot taken for production DB
3. Verify runtime config:
   - secrets present for target env
   - expected app version tag available in registry
4. Confirm release window and on-call coverage:
   - Release Commander + Observer available for full window
5. Freeze policy:
   - pause non-essential merges during cutover

## Deploy Procedure (Staging → Production)
### A. Staging Rollout
1. Trigger deploy workflow to `staging` with image/tag candidate
2. Wait for rollout completion + health probe success
3. Run smoke checks (below)
4. Hold for 10 minutes and watch metrics

### B. Production Rollout
1. Trigger deploy workflow to `production` from approved tag only
2. Track rollout status until stable replicas reached
3. Run smoke checks immediately
4. Continue active monitoring for 30 minutes

## Smoke Check Commands
Run from local shell or CI job context.

```bash
# Service health
curl -fsS https://staging.headstash.app/api/health
curl -fsS https://headstash.app/api/health

# Key route checks
curl -I https://headstash.app/
curl -I https://headstash.app/feed
curl -I https://headstash.app/login

# Optional: synthetic write path (non-prod account)
# node scripts/smoke/post-create.js --base https://headstash.app
```

Pass criteria:
- Health endpoint returns 200
- Core routes return 200/3xx (no 5xx)
- Error rate and latency remain within normal bounds

## Rollback Procedure
Trigger rollback when SEV-1, or SEV-2 persists >15 minutes.

1. Identify last known good image/tag
2. Redeploy previous stable tag to production
3. Confirm rollout healthy and smoke checks pass
4. Disable/hold current release workflow
5. Post incident summary + mitigation status

### Rollback Command Template
```bash
# Example (provider-agnostic placeholders)
export ENV=production
export PREV_TAG=<last-known-good>
./scripts/deploy.sh --env "$ENV" --image-tag "$PREV_TAG"
```

## Escalation Path
1. Release Commander announces incident in `#incidents`
2. Page Incident Lead + backend owner
3. If DB risk suspected, engage DBA and lock write operations
4. Communicate user impact every 15 minutes until recovery

## Post-Deploy Validation (T+30m)
1. Confirm no sustained 5xx spike
2. Confirm sign-in and posting flows in browser
3. Check logs for migration/runtime warnings
4. Record deployment notes in release log

## Current Status of Rollback Drill
- **Staging rollback drill:** `PENDING` (requires cloud target + staging environment from deployment plan tasks)
- Once staging environment exists, execute rollback template against staging and record:
  - start/end timestamps
  - recovered version
  - smoke check outputs

## Artifacts to Attach for Review
- CI run links (staging + production)
- Monitoring screenshot during 30m watch window
- Rollback drill transcript (when completed)
