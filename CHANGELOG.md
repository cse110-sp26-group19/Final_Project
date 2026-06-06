# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-06-06

### Added

- Cloudflare Pages Functions for the backend API, ported from the Express
  server to the Workers runtime so the app can be deployed on Cloudflare with
  the Replicate token kept server-side ([ADR 0008](docs/decisions/0008-deploy-cloudflare-pages-functions.md)):
  - `GET /api/image-proxy` — same-origin proxy for template images (SSRF-guarded).
  - `POST /api/face-swap` — proxies to Replicate using the `REPLICATE_API_TOKEN`
    env binding; returns the swapped image as a same-origin data URL.
- `wrangler.toml` Cloudflare Pages config and `pages:dev` / `pages:deploy`
  npm scripts for local emulation and deploys.
- GitHub Actions deploy workflow (CD) that publishes to Cloudflare Pages on
  push to `main`.
- Unit tests for the new Functions' request validation, wired into `npm test` / CI.

## [0.1.0] - 2026-06-05

### Added

- Initial memebro app: meme template browsing, upload, edit, and result/share
  pages; flexible flow navigation with per-page guards and a dynamic step
  indicator; Express backend with the Replicate face-swap and image-proxy
  endpoints; CI pipeline, linting/formatting, and unit tests.
