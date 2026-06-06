# 0007. Flexible page ordering with routing guards

| Attribute | Value               |
| --------- | ------------------- |
| Date      | `2026-06-05`        |
| Status    | Accepted            |
| Deciders  | Frontend team (#41) |

## Context

The meme creation flow has two inputs — a face **photo** and a chosen **template** — plus an **edit** step that needs both and a **result** step that needs a generated meme. Nothing enforced any order, which caused bugs:

- Picking a template routed to `edit.html` with no photo, so compositing silently broke.
- Direct URLs to `edit.html` / `result.html` rendered against empty state.

Issue #41 offered two models: **strict ordering** (force upload → templates → edit) or **flexible ordering** (provide the two inputs in either order, with a dynamic step indicator and an edit page that tolerates a missing input until both exist).

The site has a persistent navbar exposing **Upload** and **Templates** as independent destinations. Strict ordering fights that navbar — clicking "Templates" with no photo would bounce the user to upload. Flexible ordering matches how users actually navigate.

## Decision

We will enforce **flexible ordering** with per-page guards.

- A pure, framework-free module — `src/frontend/lib/routing-guard.js` — exposes `guardRedirect`, `nextIncompleteStep`, and `stepMeta`, all driven by a progress snapshot (`hasPhoto`, `hasTemplate`, `hasMeme`). Unit-tested in Node (`tests/routing-guard.test.js`, wired into `npm test` / CI).
- A thin browser adapter — `src/frontend/lib/session-state.js` — reads the real signals from `sessionStorage` and the URL, performs redirects via `location.replace`, and updates the step indicator.
- **`upload` and `templates` are always reachable** (either may come first, which the navbar needs). **`edit` requires both inputs** and redirects to whichever is missing. **`result` requires a generated meme**, otherwise it routes to the next incomplete step.
- After picking a template or finishing an upload, `goToNextStep()` sends the user to the next incomplete step, so the flow works in either order (template → upload → edit, or upload → templates → edit).
- The selected template id is persisted to `sessionStorage` (`memebro:selected-template`), so it survives the template → upload → edit path where the URL param would be lost.
- The **step indicator is dynamic**: whichever input the user does first reads "Step 1 of 3", the second reads "Step 2 of 3", and edit is always "Step 3 of 3".
- Shared result links (`result.html?spec=...`) remain reachable: the guard treats a `spec` URL param as a satisfied meme.

## What We Considered and Skipped

- **Strict ordering** (force upload first). Simpler, but it conflicts with the navbar and blocks the natural "browse templates first" entry. Rejected.

## Consequences

### Positives

- Users can start from either the photo or the template; the navbar works as expected.
- Pages never render against missing state; the silent edit-page break is gone.
- Guard, navigation, and step-label logic are pure and unit-tested, running in CI on every push/PR.

### Negatives/tradeoffs

- Slightly more logic than strict ordering (progress-aware navigation, dynamic labels) and more states to test.
- The step-indicator numbering depends on order, which is less rigid than a fixed 1→2→3 funnel.

### Follow-up

- The result/share step indicator is unchanged; revisit if the share page (`share.html`) is built out.
