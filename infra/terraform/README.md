# Terraform bootstrap (AWS baseline)

This directory provides an initial Terraform layout for environment-separated deployments.

## Structure

- `environments/staging` - staging stack composition
- `environments/prod` - production stack composition
- `modules/networking` - VPC/subnet inputs/outputs scaffold
- `modules/app_runtime` - app runtime inputs/outputs scaffold
- `modules/state_backend` - remote state backend strategy scaffold
- `modules/staging_ingress` - staging ALB + Route53 alias resources

## Backend state strategy

Recommended AWS backend for shared state:

- **S3 bucket** for state storage
- **DynamoDB lock table** for state locking
- Environment key prefixes (`staging/terraform.tfstate`, `prod/terraform.tfstate`)

Copy `backend.hcl.example` to environment-specific backend config and pass during init:

```bash
terraform -chdir=infra/terraform/environments/staging init -backend-config=../../backend.hcl.example
```

## Next steps

1. Replace placeholder values in `environments/*/terraform.tfvars`.
2. Add concrete resources inside module directories.
3. Run `terraform fmt -recursive` and `terraform validate` once Terraform CLI is available in CI/runtime.
