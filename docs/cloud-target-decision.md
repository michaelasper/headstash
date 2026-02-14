# Cloud Target Decision (Headstash)

Task: `50e1664f-e30e-4b88-b783-ad6e58ce6666`
Last updated: 2026-02-14

## Scope
Select a cloud target for Headstash deployment and define initial staging/production architecture with security-first defaults.

## Options Evaluated

### 1) Render
- **Pros:** fast setup, low ops overhead, simple preview/staging support.
- **Cons:** less granular IAM/networking control, Terraform support less mature than hyperscalers.
- **Fit:** good for MVP speed; weaker for strict infra/security controls.

### 2) Fly.io
- **Pros:** global edge footprint, simple app deployment model.
- **Cons:** platform-specific operational model, more custom effort for managed data/security governance.
- **Fit:** strong for distributed workloads; less ideal for conservative first production rollout.

### 3) AWS (Selected)
- **Pros:** mature IAM/security primitives, robust Terraform ecosystem, broad managed services, strong CI/OIDC integration.
- **Cons:** higher complexity and cost-management overhead.
- **Fit:** best for secure, scalable, auditable production with least-privilege controls.

## Decision
**Select AWS as primary cloud target** for first production deployment.

## Rationale
1. IAM + Secrets Manager posture aligns with security goals.
2. Terraform support is strongest for planned IaC tasks.
3. GitHub Actions OIDC with role assumption enables short-lived credentials.
4. Clear maturity path (WAF/private networking/autoscaling/DR).

## Target Architecture (Staging + Production)

### Environment Boundaries
- Separate staging/production accounts/projects:
  - `headstash-staging`
  - `headstash-production`
- Separate IAM roles, state files, and secret namespaces.

### Runtime (v1)
- App runtime: ECS Fargate behind ALB
- Data: managed Postgres (RDS, encrypted)
- Static assets: S3 + CloudFront (as needed)
- Secrets: AWS Secrets Manager
- Observability: CloudWatch logs/metrics + alarms

### Network
- Per-environment VPC with public ALB + private app/data subnets
- Least-privilege security groups
- Database not publicly accessible

### CI/CD
- GitHub Actions stages:
  - test/build
  - Terraform plan/apply to staging
  - manual approval gate before production apply
- OIDC trust from GitHub to env-scoped deploy roles

## Risks and Mitigations
1. **Cost creep** → right-size services, budget alarms, monthly reviews.
2. **IAM over-privilege** → least-privilege policies, env-scoped roles, periodic review.
3. **Operational complexity** → staging-first rollout, codified runbook, rollback drills.
4. **Terraform drift** → remote state + locking, PR-only infra changes, drift checks.

## Follow-on Tasks
- Terraform scaffold: `3ccd1d42-8464-4998-bcfd-308735201b93`
- Human security prerequisites: `1fef6f7b-30e1-4cf5-a27c-915a97423d8a`
- CI deploy workflow: `44bdc83c-e2ed-4ca4-a0d0-c1eb84c4ddb9`
- Deploy runbook/rollback: `fd551fc9-d3f7-47ce-a05b-6c8795ca58cd`
