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

## Validation / constraints

Request-boundary validation lives in `src/app/actions.ts` (Server Actions) and is intentionally kept small:

- `Review.rating` must be one of Prisma enum `ReviewRating` (`ONE`–`FIVE`).
- `Review.strainId` must be a `cuid()`.
- `Review.consumedAt` is optional; when provided it must parse as a valid date.

TODO (when we add fields/endpoints):

- If we start accepting `Strain.thcPct` / `Strain.cbdPct`, validate 0–100.
