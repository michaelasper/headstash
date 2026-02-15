# Secret + Identity Provisioning Runbook

Task: `484fd5d1-d29c-464b-a8fa-52bcd827df33`
Date: 2026-02-14
Owner: devops

## Purpose
Prepare cloud account identity and secret plumbing so CI/CD can deploy securely without long-lived credentials.

## Prerequisites (Human-owned)
1. Cloud org/account admin access
2. DNS admin access for production/staging domains
3. GitHub org admin access for repository settings
4. Billing alerts destination (email/Slack)

## 1) Cloud Account Baseline
1. Create/confirm two environments/projects:
   - `headstash-staging`
   - `headstash-prod`
2. Enable baseline services:
   - IAM/Identity federation
   - Secret Manager
   - Container registry/artifact storage
   - Logging/metrics/alerts
3. Apply budget alerts:
   - 50%, 80%, 100% thresholds

Verification:
- Confirm both projects visible and active
- Confirm alert test notification is received

Rollback:
- Remove newly-created projects if setup aborted before workloads exist

## 2) Workload Identity Federation (OIDC from GitHub Actions)
1. Create OIDC identity provider trust for GitHub (`token.actions.githubusercontent.com`)
2. Scope trust to repository + branch rules:
   - staging deploy role: default branch + staging workflow
   - production deploy role: protected tags/manual approval workflow only
3. Create deploy roles:
   - `headstash-staging-deployer`
   - `headstash-prod-deployer`
4. Grant least-privilege permissions:
   - pull/push images to registry
   - deploy service/runtime updates
   - read required runtime secrets only

Verification:
- Run dry-run GitHub Action that requests cloud token and lists target environment metadata
- Validate prod role cannot be assumed from non-protected refs

Rollback:
- Disable OIDC provider mapping
- Remove deploy role trust bindings

## 3) Secret Manager Population
Create these secrets in both staging/prod scopes:
- `DATABASE_URL`
- `JWT_SECRET`
- `SESSION_SECRET`
- `OPENAI_API_KEY`
- `REDIS_URL`
- `SENTRY_DSN` (optional)

Rules:
- Never store plaintext in repo
- Rotate values if exposed during setup
- Use separate values for staging vs prod

Verification:
- Secret listing shows all required keys
- Deploy role can read only environment-specific secrets

Rollback:
- Revoke secret access bindings
- Delete incorrectly-scoped secret versions

## 4) GitHub Repository Configuration
1. Add environment protections:
   - `staging` (light review)
   - `production` (required reviewers)
2. Add required variables:
   - `CLOUD_REGION`
   - `SERVICE_NAME`
   - `REGISTRY_NAME`
3. Add non-sensitive IDs needed for federation:
   - provider ARN/resource id
   - role identifiers
4. Do **not** add raw cloud static keys

Verification:
- Workflow can read environment variables
- Production deployment requires approval gate

Rollback:
- Remove env vars/secrets
- Disable workflow deployment jobs

## 5) End-to-End Validation Commands (Template)
```bash
# 1) Validate OIDC identity exchange (from CI job)
cloud-cli sts whoami

# 2) Validate registry push auth
cloud-cli registry login

# 3) Validate secret access (metadata only)
cloud-cli secrets list --project headstash-staging

# 4) Validate deploy dry-run
./scripts/deploy.sh --env staging --dry-run
```

Expected outcome:
- CI obtains short-lived credentials
- No long-lived secrets used in CI
- Staging dry-run succeeds

## 6) Handoff Checklist (Human Action Required)
Human must provide/confirm:
1. Final cloud provider account id + region
2. Domain names + DNS zone ownership
3. Production approvers list
4. Initial secret values (stored directly in cloud secret manager)
5. Confirmation that GitHub org-level policy allows OIDC federation

## 7) Incident/Rollback Fast Path
If authentication or secret scope fails during release:
1. Freeze production deploy workflow
2. Roll back to last known good image tag
3. Revoke suspect role bindings
4. Rotate affected secrets
5. Re-open deploy after staging verification passes
