# AWS → GitHub CI/CD First-Deploy Bootstrap Runbook

Purpose: one operator-friendly path from a fresh machine to first staging deploy readiness.

## 0) Scope + Safety

This runbook bootstraps:
- AWS infra foundations (state backend + lock table + OIDC + deploy roles)
- GitHub environment + secret/variable wiring via `gh` CLI
- Verification checkpoints so CI/CD can deploy safely

This runbook does **not** include secret values in docs/output. Keep values in your secret manager / secure terminal only.

---

## 1) Prerequisites

- macOS/Linux shell with internet access
- Access to target AWS account
- GitHub repo admin access for `michaelasper/headstash`
- `git`, `node` (>=20), `npm`, `jq`
- AWS CLI v2
- GitHub CLI (`gh`)

### Required IAM capability (operator session)

Your bootstrap operator identity needs ability to:
- S3: create/configure bucket, encryption, versioning, public access block
- DynamoDB: create/read lock table
- IAM: create/read OIDC provider, create/read/update roles, attach inline policies
- STS: `GetCallerIdentity`

---

## 2) Install & Authenticate CLIs

### AWS CLI

```bash
# macOS
brew install awscli
aws --version
```

```bash
# Configure profile
aws configure --profile headstash-bootstrap
# validate
aws sts get-caller-identity --profile headstash-bootstrap
```

### GitHub CLI

```bash
# macOSrew install gh
gh --version
```

```bash
# Auth with repo admin scope

gh auth login
gh auth status
```

---

## 3) Pull Repo + Install Dependencies

```bash
git clone https://github.com/michaelasper/headstash.git
cd headstash
git checkout main
git pull
npm ci
```

---

## 4) AWS Bootstrap (plan → apply)

> Script entrypoint: `npm run aws:bootstrap` (`scripts/aws-bootstrap.mjs`)

### 4.1 Plan

```bash
npm run aws:bootstrap -- \
  --plan \
  --repo michaelasper/headstash \
  --region us-east-1 \
  --profile headstash-bootstrap \
  --json \
  --out artifacts/aws-bootstrap.json
```

Review expected JSON keys:
- `backend.bucket`
- `backend.lockTable`
- `oidc.providerArn`
- `roles.staging.arn`
- `roles.production.arn`

### 4.2 Apply

```bash
npm run aws:bootstrap -- \
  --apply \
  --repo michaelasper/headstash \
  --region us-east-1 \
  --profile headstash-bootstrap \
  --json \
  --out artifacts/aws-bootstrap.json
```

### 4.3 Quick verify

```bash
jq '{mode, repository, region, backend, oidc, roles}' artifacts/aws-bootstrap.json
```

---

## 5) GitHub Bootstrap (plan → apply)

> Script entrypoint: `npm run github:bootstrap` (`scripts/github-env-bootstrap.mjs`)

### 5.1 Plan

```bash
npm run github:bootstrap -- \
  --plan \
  --artifact artifacts/aws-bootstrap.json \
  --repo michaelasper/headstash \
  --staging-env staging \
  --production-env production \
  --json \
  --out artifacts/github-env-bootstrap.json
```

### 5.2 Apply

```bash
npm run github:bootstrap -- \
  --apply \
  --artifact artifacts/aws-bootstrap.json \
  --repo michaelasper/headstash \
  --staging-env staging \
  --production-env production \
  --json \
  --out artifacts/github-env-bootstrap.json
```

### 5.3 Verify

```bash
# Environments

gh api repos/michaelasper/headstash/environments --jq '.environments[].name'

# Show redacted bootstrap result
jq '{mode, repository, environments, verification}' artifacts/github-env-bootstrap.json
```

---

## 6) Checkpoint Table

| Checkpoint | Command | Expected |
|---|---|---|
| AWS identity | `aws sts get-caller-identity --profile headstash-bootstrap` | Correct account id |
| AWS bootstrap plan | `npm run aws:bootstrap -- --plan ...` | JSON contains backend/oidc/roles |
| AWS bootstrap apply | `npm run aws:bootstrap -- --apply ...` | No failing steps in JSON output |
| GitHub bootstrap plan | `npm run github:bootstrap -- --plan ...` | JSON includes env wiring plan |
| GitHub bootstrap apply | `npm run github:bootstrap -- --apply ...` | Environments + variables/secrets verified |
| GitHub env list | `gh api repos/.../environments` | `staging`, `production` present |

---

## 7) Trigger First Staging Deploy

```bash
# Example: trigger deploy workflow manually (if configured for workflow_dispatch)
gh workflow run deploy.yml --repo michaelasper/headstash

# Watch latest run(s)
gh run list --repo michaelasper/headstash --limit 5
```

Capture and store:
- run URL
- run id
- job statuses

---

## 8) Rollback / Recovery

If GitHub bootstrap apply made incorrect environment values:
1. Re-run `github:bootstrap` in `--plan` to inspect delta.
2. Re-run `--apply` with corrected inputs.
3. For temporary smoke envs, delete them after validation:
   ```bash
   gh api --method DELETE repos/michaelasper/headstash/environments/<env-name>
   ```

If AWS bootstrap created wrong names:
1. Stop and export current JSON artifacts for audit.
2. Correct inputs (`--state-bucket`, role names, region) and re-run `--plan`.
3. Apply corrected config and re-verify.

---

## 9) Troubleshooting

### OIDC trust mismatch
- Symptom: role assumption failures from GitHub Actions.
- Check `oidc.providerArn` and role trust policy audience/subject conditions.
- Re-run aws bootstrap plan/apply after correcting inputs.

### Wrong AWS region/profile
- Symptom: resources appear missing, or created in unexpected region.
- Verify `--region`, `--profile`, and `aws sts get-caller-identity` output.

### gh auth / permission errors
- Symptom: `gh api` 403 / cannot set env secrets.
- Ensure account has repo admin permissions.
- Re-run `gh auth login`, then `gh auth status`.

### Secret value leakage risk
- Never paste secret values into task comments or markdown.
- Use redacted outputs only (`artifacts/github-env-bootstrap.json`).

---

## 10) Operator Handoff Payload

Post this summary to the owner-execution task after completion:
- AWS account id + region
- State bucket + lock table
- Staging + production role ARNs
- GitHub environment names confirmed
- Latest staging workflow run URL
- Redacted JSON snippets from both artifact files
