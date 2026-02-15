# Task a979c7a7 — Ultimate human-run bootstrap runbook

## Scope delivered
- Added `docs/aws-first-deploy-bootstrap-runbook.md` with full first-run path:
  - prerequisites + IAM capability expectations
  - AWS CLI install/auth and gh CLI install/auth
  - repository bootstrap + dependency install
  - `aws:bootstrap` plan/apply flow
  - `github:bootstrap` plan/apply flow
  - checkpoint table for expected outputs
  - staging workflow trigger guidance
  - rollback/recovery and troubleshooting
  - operator handoff payload template

## PR
- https://github.com/michaelasper/headstash/pull/74

## Validation evidence
- `rg -n "^## 1\)|^## 2\)|^## 4\)|^## 5\)|^## 6\)|^## 8\)|^## 9\)" docs/aws-first-deploy-bootstrap-runbook.md`
- manual section audit for copy/paste command coverage and redaction guidance

## Deliverables
- `docs/aws-first-deploy-bootstrap-runbook.md`
- `reports/aws-bootstrap-runbook-a979-2026-02-14.md`
