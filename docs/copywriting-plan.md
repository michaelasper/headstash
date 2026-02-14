# Headstash Copywriting Plan (Iterative)

## Objective
Improve clarity, trust, and conversion across Headstash by tightening copy on high-traffic/high-intent pages first, then iterating based on qualitative feedback and lightweight behavioral signals.

## Primary outcomes
- New users understand what Headstash is within 5 seconds.
- Sign-in/onboarding friction decreases (fewer drop-offs before first post/review).
- Core actions feel obvious: create post, add review, follow, save/favorite.
- Voice stays consistent: friendly, grounded, non-pretentious, cannabis-literate.

## Voice + style guardrails
- **Tone:** clear, confident, conversational; avoid hype.
- **Reading level:** short sentences, plain language, no jargon unless explained.
- **Cannabis language:** normalize common terms, avoid medical claims.
- **CTA style:** action-first verbs (“Add review”, “Share note”, “Follow grower”).
- **Microcopy rule:** every label/error/helper text must answer a user doubt.

## Content hierarchy by priority

### Wave 1 (highest impact)
1. `src/app/page.tsx` (home / positioning)
2. `src/app/auth/signin/page.tsx` + `SignInForm.tsx` (activation bottleneck)
3. `src/app/onboarding/page.tsx` + `src/app/me/page.tsx` (first-run momentum)
4. `src/app/posts/page.tsx` + `postComposer.tsx` (main contribution flow)

### Wave 2
1. `src/app/reviews/new/page.tsx`
2. `src/app/strains/new/page.tsx`
3. `src/app/search/page.tsx`
4. `src/app/u/[handle]/page.tsx`

### Wave 3
1. `src/app/notifications/page.tsx`
2. `src/app/me/favorites/page.tsx`
3. `src/app/tags/page.tsx` + `src/app/tags/new/page.tsx`
4. Long-tail empty/loading/error states across app

## Iterative workflow

### Iteration 0 — Baseline audit (this task starts here)
- Capture current copy by page/section:
  - Headlines/subheads
  - CTAs/buttons
  - Form labels + helper text
  - Validation and error messages
  - Empty states
- Flag each line as one of: **keep / tighten / rewrite / remove**.
- Mark risk-sensitive copy (policy/legal/health-adjacent) for explicit review.

### Iteration 1 — Clarity pass
- Rewrite only high-impact copy on Wave 1 pages.
- Keep UI layout unchanged (copy-only PR where possible).
- Ensure every screen answers:
  1. What is this?
  2. Why should I care?
  3. What should I do next?

### Iteration 2 — Conversion pass
- Tighten button labels and helper text around sign-in + first post/review.
- Improve empty states to nudge action.
- Add confidence language (e.g., privacy/safety guardrails) where helpful.

### Iteration 3 — Consistency pass
- Normalize naming patterns (e.g., post/review/favorite terminology).
- Remove duplicate concepts and conflicting tone.
- Create a small copy style reference in docs.

## Review rubric (for each copy update)
Score each changed screen 1–5:
- **Clarity:** Is meaning immediate?
- **Actionability:** Is next step obvious?
- **Trust:** Any over-claiming or ambiguity?
- **Tone fit:** Feels like Headstash voice?
- **Brevity:** Can we cut 20% without losing meaning?

Any score <4 gets another revision pass.

## Deliverables checklist
- [x] Create iterative plan doc in repo (`docs/copywriting-plan.md`)
- [ ] Baseline audit notes by Wave 1 page
- [ ] PR #1 (Wave 1 clarity pass)
- [ ] PR #2 (Wave 2 + consistency)
- [ ] Final mini style guide (`docs/copy-style.md`)

## Suggested PR sequencing
1. **PR A:** Add this plan + baseline audit scaffolding.
2. **PR B:** Wave 1 copy updates (home/auth/onboarding/posts).
3. **PR C:** Wave 2+3 copy + style guide.

## Risks and guardrails
- Avoid accidental product-scope changes when editing copy.
- Avoid medical/therapeutic guarantees.
- Keep labels compatible with existing form validation and tests.
- If copy implies new behavior, either implement behavior or reword.

## Definition of done for “start a copywriting plan”
- Plan exists in repo.
- Prioritized page order is explicit.
- Iteration loop + rubric are documented.
- Next PR path is clear and actionable.
