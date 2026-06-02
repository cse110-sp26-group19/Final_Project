# 0004. Run formatting, tests, and linting in CI

| Attribute | Value            |
| --------- | ---------------- |
| Date      | `2026-06-01`     |
| Status    | Accepted         |
| Deciders  | CSE 110 Group 19 |

## Context

Our GitHub Actions pipeline previously only checked Prettier formatting. Our frontend test suite existed but CI never ran it, so a change could break the tests and still pass CI. We want CI to actually run our tests and surface lint issues, without adding friction while the team adopts linting.

## Decision

We will run a single GitHub Actions workflow ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)) on every `push` and `pull_request`. It installs dependencies with `npm ci` on Node 20, then runs three steps:

1. `npm run format:check` — formatting (Prettier).
2. `npm test` — our frontend test suite.
3. `npm run lint` — ESLint, as an **informational warning only** (`continue-on-error`), so lint never fails the build.

Contributors can run the same checks locally with `npm run check` (and `npm run fix` to auto-correct).

`npm test` runs the frontend team's test files. Backend tests are owned by the backend team and are not part of this workflow.

## What We Considered and Skipped

- **Making lint blocking** — we're adopting ESLint gradually, so it reports warnings without failing CI for now. Promote it to a blocking check later.
- **A build/deploy step** — the frontend is vanilla JS/HTML/CSS with no bundler and no hosting target yet, so there is nothing to build or deploy.

## Consequences

### Positives

- Our tests and formatting are checked automatically on every push and PR.
- Lint surfaces issues without blocking anyone while the team gets used to it.
- `npm run check` mirrors CI, so green locally means green in CI.

### Negatives/tradeoffs

- Lint warnings can be ignored since they do not fail the build (intentional for now).
- The test step lists frontend test files explicitly, so new test files must be added to the `test` script.

### Follow-up

- Promote lint to a blocking check once existing warnings are addressed.
- Optionally require these checks for merge via branch protection (Settings → Branches).
- Add a deploy job if/when a hosting target is chosen.
