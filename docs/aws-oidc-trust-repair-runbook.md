# AWS OIDC trust repair runbook (staging/prod deploy roles)

Use this when Deploy workflow fails at:

`Could not assume role with OIDC: Not authorized to perform sts:AssumeRoleWithWebIdentity`

This runbook assumes you have **privileged AWS CLI access** to the target account.

---

## 0) Inputs you need

Set these before running commands:

```bash
export AWS_REGION="us-west-2"                 # change if needed
export REPO_SLUG="michaelasper/headstash"

# role names in your AWS account
export STAGING_ROLE_NAME="HeadstashStagingDeployRole"
export PRODUCTION_ROLE_NAME="HeadstashProductionDeployRole"
```

Optional if you use profiles:

```bash
export AWS_PROFILE="headstash-bootstrap"
alias aws="aws --profile ${AWS_PROFILE}"
```

---

## 1) Confirm account + OIDC provider

```bash
aws sts get-caller-identity
aws iam list-open-id-connect-providers --output json
```

You should see a provider ARN ending with:

`oidc-provider/token.actions.githubusercontent.com`

If missing, create it:

```bash
aws iam create-open-id-connect-provider \
  --url "https://token.actions.githubusercontent.com" \
  --client-id-list "sts.amazonaws.com" \
  --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1"
```

---

## 2) Build trust policy docs

### Staging trust policy (`environment:staging`)

```bash
cat >/tmp/headstash-staging-trust.json <<'JSON'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:michaelasper/headstash:environment:staging"
        }
      }
    }
  ]
}
JSON
```

### Production trust policy (`environment:production`)

```bash
cat >/tmp/headstash-production-trust.json <<'JSON'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:michaelasper/headstash:environment:production"
        }
      }
    }
  ]
}
JSON
```

Replace `ACCOUNT_ID` in both files with your actual 12-digit account ID:

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
sed -i '' "s/ACCOUNT_ID/${ACCOUNT_ID}/g" /tmp/headstash-staging-trust.json /tmp/headstash-production-trust.json
```

> If running Linux, use `sed -i` without `''`.

---

## 3) Apply trust policies

```bash
aws iam update-assume-role-policy \
  --role-name "$STAGING_ROLE_NAME" \
  --policy-document file:///tmp/headstash-staging-trust.json

aws iam update-assume-role-policy \
  --role-name "$PRODUCTION_ROLE_NAME" \
  --policy-document file:///tmp/headstash-production-trust.json
```

---

## 4) Verify trust policies took effect

```bash
aws iam get-role --role-name "$STAGING_ROLE_NAME" \
  --query 'Role.AssumeRolePolicyDocument' --output json

aws iam get-role --role-name "$PRODUCTION_ROLE_NAME" \
  --query 'Role.AssumeRolePolicyDocument' --output json
```

Verify subjects exactly:

- `repo:michaelasper/headstash:environment:staging`
- `repo:michaelasper/headstash:environment:production`

---

## 5) Ensure GitHub environment secrets point to these role ARNs

```bash
STAGING_ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${STAGING_ROLE_NAME}"
PRODUCTION_ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${PRODUCTION_ROLE_NAME}"

# requires gh auth in repo context
gh secret set AWS_ROLE_ARN --repo "$REPO_SLUG" --env staging --body "$STAGING_ROLE_ARN"
gh secret set AWS_ROLE_ARN --repo "$REPO_SLUG" --env production --body "$PRODUCTION_ROLE_ARN"
```

(Keep `AWS_REGION`, `TF_STATE_BUCKET`, `TF_STATE_LOCK_TABLE`, `TF_STATE_KEY_PREFIX` variables accurate in both environments.)

---

## 6) Rerun Deploy workflow and confirm success

Rerun the latest failed run:

```bash
gh run rerun 22028532775 --repo "$REPO_SLUG"
```

Or trigger a new Deploy run:

```bash
gh workflow run Deploy --repo "$REPO_SLUG"
```

Watch runs:

```bash
gh run list --repo "$REPO_SLUG" --workflow Deploy --limit 5
```

Success condition:
- `Configure AWS credentials (staging)` = success
- `Terraform Apply (staging)` = success

---

## 7) Evidence to post back on task

Post these in task `706939b7-9bb3-4713-91d3-55804cc62df9`:

1. AWS account ID + region used
2. Staging and production role ARNs
3. Redacted trust-policy verification output
4. Successful Deploy run URL (with staging credentials + apply passing)

Once posted, we can close the OIDC blocker and continue bootstrap closeout.
