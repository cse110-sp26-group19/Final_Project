# Pipeline C: Face Swap Approach

**Status:** accepted
**Date:** 2026-05-20

## Decision

Use the **AILabTools AI Face Swap API** as Pipeline C's face integration method,
called via a simple HTTP request rather than running a local ML model or
self-hosted server.

## Why

The core product requirement is to place the user's face into a meme template.
Every team explored this problem and hit the same constraint: the project can
only deploy to **Cloudflare Workers or GitHub Pages** — no persistent servers,
no GPU runtimes.

Pipeline C evaluated the following paths:

**Server-side ML tools (FaceFusion, InsightFace, Face2Face)**
These produce the highest quality results but require a GPU server and Python
runtime. That infrastructure is incompatible with Cloudflare/GitHub Pages
deployment. Pipeline B went deep on FaceFusion and confirmed this — the
output also degraded noticeably for users with bangs, glasses, or non-frontal
face angles.

**Replicate.com API (Pipeline B's eventual approach)**
Replicate hosts ML models behind an API, removing the GPU requirement. However
it still requires a persistent Express server to proxy requests and manage API
keys, which again conflicts with the serverless deployment constraint.

**Browser-native canvas compositing (Pipeline C original plan)**
Our first approach was to skip face swap entirely: store normalized placement
coordinates (`imageZone`) per template, detect the user's face in the browser
using the built-in `FaceDetector` API, crop it, and paste it onto the meme
canvas client-side. This works within the deployment constraint and requires
zero new dependencies. We implemented this (`imageZone` in `templates.json`,
returned by `generateMockMeme`) and it remains as a fallback for templates
where face swap is not supported.

**AILabTools AI Face Swap API (chosen)**
During API research we discovered AILabTools offers a hosted face swap endpoint
that requires only a standard multipart `POST` request. No GPU, no server to
maintain. The API is async — it returns a `task_id` and you poll for the result.
We tested it against multiple photo/template combinations and confirmed:

- Clean results when the user photo and template are similar-scale portrait shots
- ~10 second end-to-end latency (acceptable for a generation flow)
- Works with Node's built-in `fetch` and `FormData` — no new npm dependencies
- API key can be proxied through a Cloudflare Worker for production use

## What we considered and skipped

- **face-api.js** — browser JS face swap library, would require TA approval as
  a new dependency and adds significant bundle weight. Deferred.
- **MediaPipe (WASM)** — viable future option for client-side landmark detection
  and blending. More capable than `FaceDetector` but requires a new dependency
  and more implementation work. Deferred.
- **Cloudinary image transformations** — supports face detection and overlays
  but not face swap. Not the right fit.

## Known limitations

- The AILabTools API works best for portrait-style templates where the face is
  large and front-facing (e.g. `KURT`, `IRONMAN`). Templates with small or
  multi-panel faces (e.g. Drake meme) do not produce visible results because the
  face region is below the API's minimum detection size.
- Some meme templates are rejected by the API's content moderation filter
  (the two-buttons sweating meme triggered this). Those templates fall back to
  `imageZone` canvas compositing instead.
- The API key must not be exposed on the client. The production path is a
  Cloudflare Worker proxy — this is planned but not yet implemented.

## Consequences

- `face-swap.js` implements the full async flow: submit → poll → download.
- `pipeline.js` exports both `generateMockMeme` (no network, safe for tests)
  and `generateMeme` (real face swap, requires `AILAB_API_KEY`).
- `templates.json` tracks a `faceSwapSupported` flag per template so callers
  know which path to take.
- The `imageZone` canvas compositing work from earlier issues is preserved as
  the fallback for unsupported templates.
