# Task 0162 — Terraform validation blocker fix (2026-02-15)

## Summary
Resolved manager-reported Terraform validation instability on PR #97.

- PR: https://github.com/michaelasper/headstash/pull/97
- Fix commit: `232876e`
- Branch: `feat/staging-ingress-0162`

## Root cause
`Terraform Validate` workflow failed at:

```bash
terraform fmt -check -recursive infra/terraform
```

Formatting drift existed in:

- `infra/terraform/environments/staging/main.tf`
- `infra/terraform/environments/staging/terraform.tfvars`

So the check exited before validate steps.

## Fix applied
1. Installed Terraform 1.6.6 locally for parity with workflow.
2. Ran `terraform fmt -recursive infra/terraform`.
3. Ran staging validation flow:
   - `terraform -chdir=infra/terraform/environments/staging init -backend=false`
   - `terraform -chdir=infra/terraform/environments/staging validate`
4. Added provider lock file:
   - `infra/terraform/environments/staging/.terraform.lock.hcl`
5. Pushed commit `232876e` to PR branch.

## Passing evidence
- Passing Terraform workflow run:
  - https://github.com/michaelasper/headstash/actions/runs/22031548177
- Passing terraform job:
  - https://github.com/michaelasper/headstash/actions/runs/22031548177/job/63657437342
