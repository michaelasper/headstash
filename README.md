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

## Validation (TODO)

When we add the first create/update endpoints (Route Handlers or Server Actions), add minimal runtime validation at the request boundary for:

- `Review.rating` (ensure it maps to the `ReviewRating` enum)
- `Strain.thcPct` / `Strain.cbdPct` (if used, ensure 0–100)
