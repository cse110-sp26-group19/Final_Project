# 0007. Flexible, session-scoped flow navigation

| Attribute | Value               |
| --------- | ------------------- |
| Date      | `2026-06-05`        |
| Status    | Accepted            |
| Deciders  | Frontend team (#41) |

## Context

Making a meme needs two inputs — a face **photo** and a chosen **template** — then an **edit** step and a **share/result** screen. The pages assumed a single fixed order (upload → templates → edit), so:

- The step indicators were hard-coded ("Step 1/2/3 of 3"), which was wrong whenever the user started elsewhere.
- Picking a template jumped to `edit.html` with no photo, so compositing silently broke.
- The navbar exposes Upload and Templates as independent destinations, which a fixed order fights.

Issue #41 asked us to choose strict vs. flexible ordering. The team chose **flexible**: start from either input (home page or navbar), reach the other, then edit, then share.

## Decision

- **Pure rules in `src/frontend/lib/flow.js`** (`stepNumber`, `stepMeta`, `nextStep`, `guardTarget`) decide everything from a progress snapshot. No DOM, so they unit-test in Node (`tests/flow.test.js`, wired into `npm test`/CI).
- **Browser glue in `src/frontend/lib/flow-dom.js`** reads `sessionStorage` + URL and applies the rules: `guardPage`, `updateStepIndicator`, `nextHref`, `resetFlow`.
- **Either input first.** Upload and templates are always reachable. The Next button on each leads to the other input, or straight to edit once both exist. Edit requires both (redirecting to whichever is missing); result requires a generated meme.
- **Dynamic step indicator.** Whichever input the user does first reads "Step 1 of 3", the second "Step 2 of 3", edit "Step 3 of 3". The result/share screen has no step indicator.
- **Session-scoped, reset on home.** State lives in `sessionStorage` only to carry the photo/template/meme forward within one run. The home page calls `resetFlow()` on load and "+ Make another" routes home, so every fresh visit is a new process. We explicitly do **not** try to persist across reloads/visits.
- **Navbar fixed.** "Share" pointed at a non-existent `share.html`; it now points at `result.html`.

## What We Considered and Skipped

- **Strict ordering** (force upload first). Simpler, but it conflicts with the navbar and blocks browsing templates first. Rejected (this supersedes the earlier strict-order attempt).

## Consequences

### Positives

- Users start from either input; the navbar and home CTAs work in any order.
- Step numbers are always correct; pages never render against missing state.
- Flow rules are pure and unit-tested, running in CI on every push/PR.

### Negatives/tradeoffs

- State resets on returning home — intentional, but a mid-flow trip home loses progress.
- The result/share screen is not a numbered step, so the count is "of 3" creation steps rather than the full journey.

### Follow-up

- If a true Share page is built, give it its own route and revisit the navbar/step labels.
