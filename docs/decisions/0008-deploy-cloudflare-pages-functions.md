# 0008. Deploy on Cloudflare Pages + Pages Functions

| Attribute | Value            |
| --------- | ---------------- |
| Date      | `2026-06-06`     |
| Status    | Accepted         |
| Deciders  | CSE 110 Group 19 |

## Context

We need to deploy memebro so the live app works end to end — including the face-swap, which calls the Replicate API with a secret token (`REPLICATE_API_TOKEN`). That token must stay server-side: anything shipped to the browser is public, so a client-embedded key is a leaked key.

The course constrains where server-side code may run:

- _"Any server-side based technologies must work on **Cloudflare or GitHub Pages only**."_
- _"Deployment can happen to **GitHub Pages, Cloudflare, or as a downloadable asset**."_

This rules out generic Node hosts (Render, Railway, Fly, etc.). What the app needs at runtime:

- **Static frontend** — HTML/CSS/JS (GitHub Pages or Cloudflare can both serve this).
- **`POST /api/face-swap`** — proxies to Replicate; requires the secret. **Needs a server.**
- **`GET /api/image-proxy`** — same-origin proxy for template images so the canvas isn't tainted and PNG export works. **Needs a server.**
- Template browsing already calls `api.imgflip.com` directly from the browser, so it needs no backend.

GitHub Pages is static-only and cannot run the two API routes or hold the secret. Of the permitted options, only **Cloudflare** can host server-side code with secrets.

## Decision

We will deploy on **Cloudflare Pages** for the static frontend and **Cloudflare Pages Functions** for the two API routes.

- The frontend is served by Cloudflare Pages.
- `/api/face-swap` and `/api/image-proxy` are implemented as Pages Functions running on the Workers runtime (`fetch`-based; no Express/axios/dotenv).
- `REPLICATE_API_TOKEN` is stored as a Cloudflare **environment secret** (project settings / `wrangler`), read via an env binding inside the Function — never committed and never sent to the client.
- Because the Functions live under the same origin as the site (`/api/*`), the frontend keeps calling `window.location.origin/api/...` and there is **no CORS rework**.
- Deployment is automated from `main` via a GitHub Actions CD job (`wrangler pages deploy`).

## What We Considered and Skipped

- **Generic Node host (Render / Railway / Fly).** Easiest port (the existing Express server already serves frontend + API), but **not permitted** by the course's "Cloudflare or GitHub Pages only" rule. Rejected.
- **GitHub Pages frontend + Cloudflare Worker backend (split origins).** Allowed, but adds cross-origin wiring: the frontend would need its API base pointed at the Worker URL and the backend's CORS allowlist updated. More moving parts than Pages + Functions for no benefit. Rejected.
- **GitHub Pages only (static).** Template browsing would work, but face-swap and PNG export would be broken and there is nowhere to keep the secret. Not a working app. Rejected.

## Consequences

### Positives

- Satisfies the course constraint (server-side runs on Cloudflare).
- The Replicate key stays server-side as a Cloudflare secret; nothing sensitive ships to the browser.
- Same-origin Functions mean no CORS changes to the frontend.
- One platform hosts both the site and the API; CD via GitHub Actions fits the required pipeline.

### Negatives/tradeoffs

- The Express + axios + dotenv backend must be **ported** to the Workers runtime (`fetch`, env bindings). The logic is small (two endpoints) but it is a rewrite, not a lift-and-shift.
- Adds Cloudflare tooling (`wrangler`) and a platform account/binding to maintain. (Cloudflare is explicitly named in the course constraints, so no separate dependency approval is required for the runtime choice.)
- Local dev gains a second path (`wrangler pages dev`) alongside the existing Node server.

### Follow-up

- Tracked in #106: port the two API routes to Pages Functions, add `wrangler` config, set the secret, add the CD job, bump SemVer + CHANGELOG, and link the live URL from the docs.
- Merge in-flight frontend PRs before the first production deploy so the live state is coherent.
