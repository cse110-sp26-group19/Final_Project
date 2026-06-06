# 0007. Enforce strict page ordering with routing guards

| Attribute | Value               |
| --------- | ------------------- |
| Date      | `2026-06-05`        |
| Status    | Accepted            |
| Deciders  | Frontend team (#41) |

## Context

The meme creation flow is a four-step funnel: **upload → templates → edit → result**. Each page assumes the prior steps happened — the edit page needs a face photo in `sessionStorage` and a selected template, the result page needs a generated meme spec. Nothing enforced that order:

- Home's "Browse Templates" CTA jumped straight to `templates.html` (Step 2) without an upload.
- Picking a template routed to `edit.html` with no photo, so compositing silently broke.
- Direct URL access to `edit.html` or `result.html` rendered against empty state.

Issue #41 asked us to choose between **strict ordering** (guard each page, redirect to the earliest unfinished step) and **flexible ordering** (any order, with a dynamic "Step N of M" indicator and an edit page that tolerates a missing photo or template).

## Decision

We will enforce **strict ordering** with per-page guards.

- A pure, framework-free module — `src/frontend/lib/routing-guard.js` — decides, from a progress snapshot (`hasPhoto`, `hasTemplate`, `hasMeme`), whether a page may render or must redirect, and to which step. It is unit-tested in Node (`tests/routing-guard.test.js`, wired into `npm test` / CI).
- A thin browser adapter — `src/frontend/lib/session-state.js` — reads the real signals from `sessionStorage` and the URL and performs the redirect via `location.replace` (so guarded bounces don't trap the back button).
- Each page controller calls `enforceGuard(page)` at the top of its init.
- The selected template id is persisted to `sessionStorage` (`memebro:selected-template`) in addition to the existing URL param, so the edit-page guard can verify it.
- Home's "Browse Templates" CTAs route through `upload.html` first.
- The step indicator stays fixed (`Step N of 3`) — correct under strict ordering, since you only reach a page once its prerequisites are met.

Shared result links (`result.html?spec=...`) remain reachable: the guard treats a `spec` URL param as a satisfied meme so links open for visitors who never ran the funnel.

## What We Considered and Skipped

- **Flexible ordering** with a dynamic step indicator and an edit page that handles "have one, missing the other." Friendlier, but materially more code and more edge cases to test. Deferred as a possible later enhancement; strict ordering is the safer first pass.

## Consequences

### Positives

- Pages never render against missing state; the silent edit-page break is gone.
- Guard logic is pure and unit-tested, running in CI on every push/PR.
- `location.replace` keeps the back button sane.

### Negatives/tradeoffs

- Users cannot pick a template before uploading. The two Home CTAs ("Browse"/"Random") now both lead to upload, which is slightly redundant.
- The "Random" entry intent is lost at the Home screen (random is still available on the templates page after upload).

### Follow-up

- If users want template-first browsing, revisit flexible ordering (and a dynamic step indicator) as a follow-up issue.
