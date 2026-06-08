# 0009. E2E testing with Jest + Puppeteer

| Attribute | Value            |
| --------- | ---------------- |
| Date      | `2026-06-06`     |
| Status    | Accepted         |
| Deciders  | CSE 110 Group 19 |

## Context

The existing test suite (`npm test`) uses Node's built-in `node:test` runner and covers unit and
integration tests for individual modules: `meme-canvas`, `templates`, `server`, `replicate-client`,
`flow`, and the Cloudflare functions. These tests run in Node and never open a browser.

What was missing was a smoke test for the **full user journey** — a real browser navigating
home → templates → edit → result — to catch regressions in routing, sessionStorage hand-off
between pages, and page wiring. A teammate could break navigation logic, the Next button URL,
or the sessionStorage keys and none of the existing unit tests would catch it.

## Decision

We will use **Jest + Puppeteer** (via `jest-puppeteer`) for browser-based E2E tests, kept in a
separate `tests/e2e/` folder and run with a dedicated `npm run test:e2e` script.

The E2E suite:

- Starts the Express server (`npm start`) before tests run, so the image proxy and static file
  serving both work exactly as they do in production.
- Runs 8 smoke tests covering the full funnel: home page loads, Browse navigates to templates,
  template grid populates, clicking a card stores the selection, edit page renders with a canvas,
  Generate navigates to result, result page shows canvas + Make another link, Make another returns
  home.
- Seeds `sessionStorage` (`memebro:face-photo`, `memebro:selected-template`) with stub data
  where needed so guarded pages render instead of redirecting, without requiring a real file upload.
- Does **not** call the live Replicate face-swap API — tests pass on the text-only fallback path.
- Runs with `--maxWorkers=1` to avoid multiple Chrome instances conflicting.

The existing `npm test` suite is unchanged. `npm run test:e2e` is a separate opt-in command.

## What We Considered and Skipped

- **Playwright** — the team already had a `.playwright-mcp/` artifact, but no Playwright test
  infrastructure was set up. Jest + Puppeteer was chosen because the issue spec called for it
  explicitly and it integrates naturally with the existing Jest ecosystem.
- **Cypress** — full-featured but heavier, requires a separate config and has a steeper learning
  curve. Overkill for a smoke-test suite on a student project.
- **Adding E2E to `npm test`** — kept separate because E2E requires a running server and a real
  browser, which would slow down every CI run. Unit tests stay fast; E2E is opt-in.
- **Using `http-server` instead of Express** — initially tried `http-server` for simplicity, but
  `edit.js` requires `/api/image-proxy` to load template images, which only the Express server
  provides. Switched to `node src/backend/server.js`.

## Consequences

### Positives

- Regressions in routing, sessionStorage hand-off, or page wiring are caught by a real browser test.
- The test suite documents the expected user journey as executable specs.
- No external service dependencies — tests pass locally without any API keys.

### Negatives / Tradeoffs

- Adds `jest`, `puppeteer`, `jest-puppeteer`, `babel-jest`, `@babel/core`, `@babel/preset-env`, and
  `http-server` as devDependencies (~650 packages). These are dev-only and never shipped to the
  browser, but they increase `npm install` time.
- `npm run test:e2e` is not yet wired into CI — it requires a display/browser environment that the
  current GitHub Actions runner does not have configured.
- The stub face photo and seeded sessionStorage mean the tests do not exercise the real upload flow.

### Follow-up

- Wire `npm run test:e2e` into CI using `xvfb` or a headless browser action if desired.
- Add E2E tests for the upload step (file input) once that flow stabilizes.
- Consider replacing the `babel.config.cjs` + CommonJS workaround with native ESM Jest support
  when Jest's ESM support matures.
