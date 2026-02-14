# Headstash

Mobile-friendly web app for logging cannabis strain reviews.

## Prereqs

## UI foundations

- See `docs/design.md` for semantic tokens + focus ring + typography/spacing guidance.
- See `docs/prisma-migration-hardening.md` for migration safety and deploy rollback checklist.

- Node.js 20+
- npm

## Setup

```bash
# install deps
npm ci

# set env vars
cp .env.example .env

# create/apply local sqlite migration
make db-migrate

# seed deterministic local demo data
make db-seed

# run the dev server
make dev
```

## Runtime commands

Use these commands locally so dev/CI/prod workflows stay aligned:

```bash
make help
make dev
make lint
make typecheck
make build
make sanity
make db-generate
make db-migrate
make db-deploy
make db-reset
make db-seed
make db-reset-seed
```

### Deploy bootstrap helper scripts

Use these scripts to wire AWS + GitHub deployment prerequisites from machine-readable artifacts:

```bash
# 1) Create/verify AWS backend + OIDC + deploy role metadata artifact
npm run aws:bootstrap -- --plan --json
npm run aws:bootstrap -- --apply --repo <owner/repo> --profile <aws-profile>

# 2) Configure GitHub staging/production environments from aws artifact
npm run github:bootstrap -- --plan --json
npm run github:bootstrap -- --apply --artifact artifacts/aws-bootstrap.json
```

- `aws:bootstrap` writes `artifacts/aws-bootstrap.json` (backend + OIDC + role metadata contract).
- `github:bootstrap` consumes that artifact, upserts GitHub environments, sets env vars/secrets, and writes a redacted verification artifact.
- Both support `--plan` (default) and `--apply`; `--json` prints machine-readable output for CI logs.

### Staging DNS + health readiness automation

Use this script to verify rollback-drill readiness (DNS + TLS + health endpoint), with optional Route53 UPSERT support:

```bash
npm run staging:readiness -- --host=staging.headstash.app --health-path=/api/health
npm run staging:readiness -- --json
npm run staging:readiness -- --apply --aws-zone-id=<zone-id> --aws-target=<alb-or-dns-target> --aws-profile=<profile>
```

- `staging:readiness` checks DNS resolution, TLS certificate validity, and health endpoint status.
- `--apply` performs Route53 UPSERT before validation (AWS CLI required).
- Use `--json` for CI/log-friendly machine output.

### Local observability toggles

Use these optional env vars in `.env` for local diagnostics:
- `PRISMA_SLOW_QUERY_THRESHOLD_MS` (default `100`)
- `PRISMA_LOG_FORMAT` (`text` or `json`)
- `PRISMA_LOG_INCLUDE_QUERY` (`1` to include SQL + params in logs)

### GitHub OAuth setup (optional)

1) Create a GitHub OAuth App
- Callback URL: `http://localhost:3000/api/auth/callback/github`

2) Set env vars:
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

### Email + password setup (optional)

No extra env vars required.

- Use the **Email + password** section on `/auth/signin`.
- Passwords are hashed with bcrypt.
- Rate limiting is in-memory (dev-only) and resets on server restart.

### Local auth parity mode

Set `AUTH_LOCAL_MODE="credentials-only"` in `.env` to run a local auth mode that mirrors production-style protected-route behavior with credentials sessions only (disables GitHub + magic link on sign-in UI).

### Profile MVP

- Edit profile at `/profile` (requires sign-in)
- Public profile: `/u/[handle]` (no auth required)
- Fields: `displayName`, `handle` (unique, @format), `bio`, `avatarUrl`, `links` (URLs)

Handle rules:
- Stored in canonical form: lowercase, always prefixed with `@`
- Allowed chars: `a-z`, `0-9`, `_`
- Length: 3–20 characters (including `@`)
- Reserved handles are blocked (e.g. `@admin`, `@auth`, `@api`, `@posts`, `@u`, ...)

### Posts v0

- Global feed: `/posts` (public)
- Following feed: `/posts/following` (requires sign-in)
- Creating a post requires sign-in
- Posts can optionally attach a review (v0)

### Search v0

- Search users and posts at `/search`
- Simple substring matching (SQLite, no full-text search)

### Onboarding v0

- Signed-in users without a handle are prompted from `/me` to complete onboarding at `/onboarding`.

### Follow v0

- Follow/unfollow from public profiles: `/u/[handle]`
- Shows follower/following counts

### Reactions v0

- Like posts on `/posts` (auth required to like)
- Shows like count + current user state

### Favorites v0

- Favorite posts on `/posts` and `/posts/[id]` (auth required)
- View your favorites at `/me/favorites`

### Notifications v0

- In-app notifications at `/notifications` (auth required)
- Events: follow, like your post, comment on your post

### Comments v0

- Post detail page: `/posts/[id]`
- Commenting requires sign-in

### Avatar upload (dev-local only)

DEV ONLY: uploading an avatar writes into `public/uploads/avatars/` and sets `avatarUrl` to a local path.

- This is not suitable for serverless/production.
- Uploaded files are gitignored.

Open http://localhost:3000

## Verify

```bash
make sanity
# optionally, for full production-bundle verification when env is configured:
make build
```

## Prisma Studio (optional)

```bash
npx prisma studio
```

## Environment

Runtime env is validated at startup. Invalid/incomplete configuration fails fast with a clear error.

Required in **all** environments:

- `DATABASE_URL`

Required in **production**:

- `AUTH_SECRET` (or `NEXTAUTH_SECRET`)
- `AUTH_URL` (or `NEXTAUTH_URL`)

Development/test defaults:

- `AUTH_SECRET` / `NEXTAUTH_SECRET` default to a local dev secret if omitted
- `AUTH_URL` / `NEXTAUTH_URL` default to `http://localhost:3000` if omitted

Optional integrations:

- GitHub OAuth: `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` (must be set together)
- SMTP magic links: `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`, `EMAIL_FROM` (all-or-none)
- Local parity mode: `AUTH_LOCAL_MODE=full|credentials-only`
- Prisma slow query logging threshold: `PRISMA_SLOW_QUERY_THRESHOLD_MS` (default `100`)

See `.env.example` for complete values and comments.

## Validation / constraints

Request-boundary validation lives in `src/app/actions.ts` (Server Actions) and is intentionally kept small:

- `Review.rating` must be one of Prisma enum `ReviewRating` (`ONE`–`FIVE`).
- `Review.strainId` must be a `cuid()`.
- `Review.consumedAt` is optional; when provided it must parse as a valid date.
- `Review` can optionally be tagged with 1 Effect tag + 1 Terpene tag (v1).

## Tags (effects / terpenes)

Headstash supports two kinds of tags for filtering reviews:

- **Effects** (e.g., Relaxed, Uplifted)
- **Terpenes** (e.g., Limonene, Myrcene)

Create tags at `/tags` (or `/tags/new`), then select them when creating a review.

Filtering:

- Use the `/reviews` page search box for strain name (and notes).
- Use the Effect/Terpene dropdown filters to narrow results.

TODO (when we add fields/endpoints):

- If we start accepting `Strain.thcPct` / `Strain.cbdPct`, validate 0–100.
