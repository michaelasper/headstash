# Headstash Copy Style Guide

Practical copy rules for product UI and content surfaces.

## 1) Voice and tone

### Core voice
- Clear, grounded, and helpful.
- Friendly without sounding overly casual.
- Cannabis-literate, but never exclusionary.

### Tone targets
- **Default UI tone:** calm, direct, low-friction.
- **Action moments:** encouraging and specific.
- **Errors/limits:** honest, non-blaming, concise.

### Avoid
- Internal/dev jargon in user-facing copy (`v0`, `dev`, `auth`, `OAuth`, `SMTP`, etc.).
- Hype and over-promising language.
- Medical or therapeutic claims about cannabis effects.

## 2) Clarity rules

Every screen should quickly answer:
1. What is this?
2. Why should I care?
3. What should I do next?

Use plain words and short sentences. Prefer concrete verbs over abstract nouns.

## 3) Naming and terminology

### Preferred terms
- **review** (not rating entry/log)
- **post** (for feed content)
- **favorites** (as feature label)
- **handle** (for public username)
- **account** (for signed-in self area)

### Consistency rules
- Use "email + password" formatting consistently.
- Prefer sentence case for labels and helper copy.
- Keep button labels action-first.

## 4) CTA patterns

Use clear verb-first actions:
- **Add review**
- **Browse reviews**
- **Write a post**
- **Send magic link**
- **Continue onboarding**
- **Edit profile**

Avoid vague actions like “Continue” unless context is obvious.

## 5) Helper text and microcopy

Helper text should reduce uncertainty, not expose implementation details.

### Good
- “We limit repeated attempts to help protect your account.”
- “Tip: your profile link uses your handle (for example, `/u/yourname`).”

### Avoid
- “Rate limiting is in-memory (dev-only).”
- “If SMTP isn’t configured, check server console.”

## 6) Empty and fallback states

Use empty states to guide the next step.

### Pattern
- State: what’s currently empty.
- Prompt: what the user can do next.

Example:
- “No posts yet.”
- “Be the first to share a note, strain take, or quick review.”

Fallback labels should be human-readable:
- Prefer **“Date not added”** over placeholder-style text like **“(no date)”**.

## 7) Cannabis language guardrails

- Frame effects as user experiences, not guarantees.
- Avoid medical framing unless explicitly supported and reviewed.
- Keep language neutral and inclusive for both new and experienced users.

## 8) Pre-merge copy checklist

Before shipping copy changes, confirm:
- [ ] No internal/dev terminology appears in user-facing UI.
- [ ] Labels and CTA verbs are consistent with this guide.
- [ ] Empty states include a clear next action.
- [ ] Error/helper text is user-safe and non-technical.
- [ ] Cannabis wording avoids therapeutic/medical claims.
