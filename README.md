# Headstash

Mobile-friendly web app for logging cannabis strain reviews.

## Prereqs

- Node.js 20+
- npm

## Setup

```bash
# install deps
npm ci

# set env vars
cp .env.example .env

# create/apply local sqlite migration
npx prisma migrate dev

# run the dev server
npm run dev
```

Open http://localhost:3000

## Verify

```bash
npx prisma validate
npx prisma generate
npm run lint
npm run build
```

## Prisma Studio (optional)

```bash
npx prisma studio
```

## Environment

Expected env vars (see `.env.example`):

- `DATABASE_URL` (SQLite connection string)
- `AUTH_SECRET` (required in prod; dev default exists)
- `AUTH_URL` (recommended; base URL for callbacks)

Email magic link (optional SMTP; dev fallback logs magic link to console):

- `EMAIL_SERVER_HOST`
- `EMAIL_SERVER_PORT`
- `EMAIL_SERVER_USER`
- `EMAIL_SERVER_PASSWORD`
- `EMAIL_FROM`

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
