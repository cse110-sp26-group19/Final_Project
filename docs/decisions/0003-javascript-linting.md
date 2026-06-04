# 0003. Add ESLint for JavaScript linting

| Attribute | Value            |
| --------- | ---------------- |
| Date      | `2026-06-01`     |
| Status    | Accepted         |
| Deciders  | CSE 110 Group 19 |

## Context

[0001](0001-code-style-tooling.md) standardized formatting on Prettier and explicitly deferred a linter: "ESLint will get its own ADR once we start writing JavaScript." We are now writing JavaScript across `src/frontend`, `src/backend`, `tests`, and `tools`, and the course rules require linting/quality checks.

Formatting and correctness are different concerns. Prettier makes code _look_ consistent but does not catch a typo'd variable name, an unused import, unreachable code, or a `==` where `===` was meant. We need a tool that does — without drowning 11 contributors in style noise we already settled with Prettier.

## Decision

We will add **ESLint** (flat config, `eslint.config.js`) using its built-in **recommended** ruleset, run via `npm run lint`. ESLint owns JavaScript _correctness_; Prettier keeps owning _formatting_ — the two do not overlap.

Browser and Node globals are both enabled project-wide (our code runs in both environments), and `no-unused-vars` is a **warning** (not an error) that ignores names prefixed with `_`, so an in-progress variable never blocks a teammate while still surfacing dead code.

## What We Considered and Skipped

- **A stricter preset (e.g. Airbnb)** — catches more but generates hundreds of warnings on existing code and reopens style debates Prettier already closed. Not worth it at our scale.
- **typescript-eslint** — we write plain JavaScript, so there is nothing for it to type-check. Revisit only if we adopt TypeScript.
- **Biome** (one-tool formatter + linter) — faster, but we already standardized on Prettier and its ecosystem is still maturing (same reasoning as [0001](0001-code-style-tooling.md)).
- **`eslint-plugin-prettier`** (run formatting through ESLint) — the Prettier team recommends against it; [0001](0001-code-style-tooling.md) already made formatting Prettier's job.

## Consequences

### Positives

- Catches real bugs a formatter cannot (dead code, undefined references, unreachable code).
- `npm run lint` (bundled into `npm run check`) runs identically locally and in CI.
- The recommended ruleset is low-friction: existing code already passes with zero errors.

### Negatives/tradeoffs

- ESLint pulls in transitive dependencies, enlarging `node_modules` (counter to the minimalism noted in [0001](0001-code-style-tooling.md)) — accepted as the cost of real bug-catching.
- Permissive browser + Node globals mean a backend-only file using a browser global won't be flagged. Accepted for config simplicity; can be scoped per-directory later if it causes problems.

### Follow-up

- Wire `npm run lint` into CI — see [0004](0004-ci-pipeline.md).
- Document `npm run lint` / `npm run fix` in [`CONTRIBUTING.md`](../../CONTRIBUTING.md#development-setup).
- `preserve-caught-error` is temporarily set to **warn** (not error) because pre-existing backend code (`src/backend/replicate-client.js`) re-throws errors in `catch` blocks without forwarding the original via `cause`. Fix those call sites (`throw new Error(msg, { cause: error })`), then promote the rule back to `error`.
- Revisit a stricter ruleset or per-directory globals if correctness bugs start slipping through.
