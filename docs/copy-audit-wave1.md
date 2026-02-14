# Wave 1 Baseline Copy Audit

Scope from `docs/copywriting-plan.md`:
- `src/app/page.tsx`
- `src/app/auth/signin/page.tsx`
- `src/app/auth/signin/SignInForm.tsx`
- `src/app/onboarding/page.tsx`
- `src/app/me/page.tsx`
- `src/app/posts/page.tsx`
- `src/app/posts/postComposer.tsx`

Legend: **keep / tighten / rewrite / remove**

## 1) Home (`src/app/page.tsx`)

- **"Headstash"** — keep
- **"A simple, mobile-first stash for cannabis strain reviews."** — tighten
  - Reason: clear but could better signal social/feed features.
- **"Find reviews"** — keep
- **"Search by strain name or notes"** (sr label) — keep
- **"Search strain name or notes…"** (placeholder) — keep
- **"Search"** (button) — keep
- **"Tip: filter by Effect / Terpene on the Reviews page."** — tighten
  - Reason: capitalize terms consistently and simplify slash usage.
- **"Quick actions"** — keep
- **"Add a review"** — keep
- **"View reviews (search + filters)"** — tighten
  - Reason: parenthetical feels dev-ish; can be cleaner.
- **"Manage strains"** — keep
- **"Manage tags (effects / terpenes)"** — tighten
  - Reason: punctuation/formatting consistency.
- **"Posts (feed)"** — tighten
  - Reason: label should be plain action/value.
- **"Search"** — keep
- **"Account (auth)"** — rewrite
  - Reason: "auth" is internal/dev wording.
- **"What you can track (v1)"** — tighten
  - Reason: avoid version-centric user-facing copy.
- **"No accounts yet. This is local/dev-friendly and evolves from here."** — rewrite
  - Reason: useful in dev, but weakens trust for end users.

## 2) Sign-in shell (`src/app/auth/signin/page.tsx`)

- **"Sign in"** — keep
- **"Magic link, GitHub OAuth, or email+password."** — tighten
  - Reason: "OAuth" and plus-sign formatting feel technical.
- **"Home"** — keep

## 3) Sign-in form (`src/app/auth/signin/SignInForm.tsx`)

- **"Sign in with GitHub"** — keep
- **"If GitHub OAuth isn’t configured, this will error."** — rewrite
  - Reason: technical/internal; should be user-safe.
- **"or"** separators — keep
- **"Email + password"** — keep
- **"Create account"** (tab) — keep
- **"Could not create account. Please try again."** — keep
- **"Email"** / **"Password"** — keep
- **"Min 8 characters"** — keep
- **"Create account" / "Sign in"** (submit) — keep
- **"Note: rate limiting is in-memory (dev-only) and will reset on server restart."** — rewrite
  - Reason: internal implementation detail.
- **"Email magic link"** — keep
- **"Send magic link"** — keep
- **"DEV: if SMTP isn’t configured, the magic link is printed to the server console."** — rewrite
  - Reason: internal/dev-only detail in user surface.

## 4) Onboarding (`src/app/onboarding/page.tsx`)

- **"Onboarding"** — tighten
  - Reason: functional but cold label.
- **"Sign in to continue."** — keep
- **"Sign in"** — keep
- **"Welcome"** — keep
- **"Set your handle and basic profile to get started."** — keep
- **"Skip"** — keep
- **"Tip: your public profile URL is based on your handle."** — keep

## 5) Me page (`src/app/me/page.tsx`)

- **"Me"** — tighten
  - Reason: acceptable, but "Account" may be clearer in nav contexts.
- **"You are not signed in."** — keep
- **"Sign in"** — keep
- **"Welcome" / "Let’s set up your profile."** — keep
- **"Continue onboarding"** — keep
- **Top nav labels: "Posts", "Favorites", "Notifications", "Search"** — keep
- **"Email:"** — keep
- **"Edit profile"** — keep
- **"View public profile"** — keep
- **"Sign out"** — keep

## 6) Posts feed (`src/app/posts/page.tsx`)

- **"Posts"** — keep
- **"A simple feed (v0)."** — rewrite
  - Reason: versioning/dev framing reduces perceived quality.
- **"Home"** — keep
- **"Sign in to create posts."** — keep
- **"Sign in"** — keep
- **"No posts yet."** — keep
- **"Write the first one above — short notes, strain takes, anything."** — keep
- **"Sign in to create the first post."** — keep
- **"(no date)"** (review card fallback) — tighten
  - Reason: can be friendlier/clearer.
- **"View review"** — keep
- **"Liked" / "Like"** — keep
- **"Favorited" / "Favorite"** — keep
- **"Sign in to react"** — keep
- **"View (x comment[s])"** — keep
- **"x likes · y favorites"** — keep

## 7) Post composer (`src/app/posts/postComposer.tsx`)

- **"New post"** — keep
- **"What’s on your mind?"** — keep
- **"Attach a review" (Optional)** — keep
- **"Post" / "Posting…"** — keep

## Cross-page findings

### Terms to normalize
- "Email + password" vs "email+password" → standardize spacing/style.
- Remove user-visible "v0/v1/dev/local/auth" jargon from primary surfaces.

### High-priority rewrite targets (before Wave 1 clarity PR)
1. Home footer dev disclaimer
2. Sign-in technical caveats (OAuth/SMTP/rate-limit implementation text)
3. Posts subtitle "(v0)"
4. Home CTA labels with internal wording ("Account (auth)")

### Risk-sensitive copy flags
- Any cannabis-effect phrasing must avoid medical/therapeutic claims.
- Avoid implying privacy/security guarantees not implemented.
