# Namecheap → Route53 staging DNS runbook

Use this runbook when the domain is registered at Namecheap and DNS is hosted in AWS Route53.

## Goal

Make `staging.headstash.app` publicly resolvable with valid TLS and a healthy `/api/health` endpoint so rollback drills can run.

## Prerequisites

- AWS CLI authenticated to the target account (`aws sts get-caller-identity` works)
- Route53 hosted zone already created for your domain (example: `headstash.app`)
- Staging ingress DNS target available (ALB/CloudFront/app host)
- Repo checked out locally

## 1) Prepare repo

```bash
cd /Users/michaelasper/.openclaw/workspace-devops/headstash
git checkout main && git pull
npm ci
```

## 2) Get Route53 nameservers + Namecheap handoff guide

```bash
npm run -s staging:readiness -- \
  --namecheap-guide \
  --route53-zone-id=<HOSTED_ZONE_ID> \
  --namecheap-domain=headstash.app \
  --host=staging.headstash.app \
  --health-path=/api/health \
  --json
```

From output, copy `namecheapGuide.nameServers`.

## 3) Update Namecheap nameservers

In Namecheap:

1. **Domain List** → your domain → **Manage**
2. **Nameservers** → **Custom DNS**
3. Replace existing nameservers with all Route53 nameservers from step 2
4. Save changes

Wait for propagation (often minutes, can take longer).

## 4) UPSERT staging DNS in Route53

```bash
npm run -s staging:readiness -- \
  --apply-route53 \
  --route53-zone-id=<HOSTED_ZONE_ID> \
  --route53-record-name=staging.headstash.app \
  --route53-record-type=CNAME \
  --route53-record-value=<STAGING_INGRESS_DNS_NAME> \
  --route53-ttl=60 \
  --json
```

## 5) Verify readiness

```bash
npm run -s staging:readiness -- \
  --host=staging.headstash.app \
  --health-path=/api/health \
  --json
```

Success target: `"ok": true` with `dns.ok=true`, `tls.ok=true`, `health.ok=true`.

## 6) Evidence to post on task 53f5

Paste:

- Route53 apply JSON output
- Final readiness JSON output with `ok: true`
- Final staging hostname and DNS target used
