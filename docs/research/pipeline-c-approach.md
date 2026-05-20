# Pipeline C: Face Integration Research and Approach

## Overview

Pipeline C is one of three experimental backend pipelines being developed in
parallel for MemeBro. Each pipeline takes a different approach to the core
challenge: given a user-uploaded photo and a selected meme template, produce
a compelling, shareable meme.

This document records the research process, trade-off analysis, and
architectural decisions that led Pipeline C to its current approach.

---

## What Other Pipelines Tried

During the sprint, all three backend teams investigated face swap and face
blending as the primary integration method.

**Pipeline A** explored a Gemini-backed image generation flow paired with an
Express API server. The team ran into module system conflicts (CJS vs ESM),
image blending quality issues, and infrastructure complexity that slowed
iteration. Face swap tooling proved difficult to integrate within the
project's deployment constraints.

**Pipeline B** went deep on FaceFusion — an open-source, GPU-accelerated
face-swapping tool. The team built out an API client, file ingestion pipeline,
image normalization utilities, and a core face-swapping execution endpoint.
Despite significant engineering effort, FaceFusion's requirements (GPU
runtime, Python server, heavy model weights) made it incompatible with the
project's Cloudflare/GitHub Pages deployment constraint. Output quality also
degraded noticeably with users who had bangs, glasses, or non-frontal face
angles — consistent with findings from the team's earlier market research.

The broader team acknowledged the difficulty: face swap tooling is genuinely
hard to get right. Existing consumer apps like memeclip.ai take upwards of
11 seconds per generation and still produce poor results for a large
percentage of real user photos.

---

## Why Pipeline C Took a Different Path

Rather than doubling down on server-side face swapping, Pipeline C made an
early architectural decision to separate two concerns that other approaches
were conflating:

1. **Where does the user's image go?** — a placement problem
2. **What should the meme say?** — a caption generation problem

Treating these as separate, independently solvable problems opened up a
much simpler path to a working prototype.

---

## Pipeline C's Approach

### Context-Driven Template Metadata

Each meme template in Pipeline C's store carries two pieces of structured
metadata beyond the image URL:

- **`context`** — a human-readable description of the meme's visual layout,
  tone, and text zones. This is what gets sent to an LLM to generate a
  relevant caption without the LLM needing to "see" the image.
- **`imageZone`** — normalized (0..1) coordinates describing the region of
  the meme template where a user's face or photo should be placed. These
  coordinates are determined once per template and reused across all
  generations.

This metadata-first approach means the backend can guide both caption
generation and image placement without requiring any image analysis at
request time.

### Browser-Native Face Detection and Compositing

Rather than sending the user's photo to a server for face detection, Pipeline
C uses the browser's built-in `FaceDetector` API (available in Chrome and
Edge) to:

1. Detect the face bounding box in the user's uploaded photo, entirely
   client-side
2. Crop the face region to a small canvas element
3. Composite the cropped face onto the meme template canvas at the
   `imageZone` coordinates returned by the pipeline

This approach has several concrete advantages:

- **Zero latency for face detection** — no server round trip, no model
  loading delay. Detection runs in milliseconds in the browser.
- **No new dependencies** — `FaceDetector` is a browser built-in. No npm
  package, no TA approval required.
- **Privacy-friendly** — the user's photo never leaves their device for the
  face detection step.
- **Deployment compatible** — runs entirely in the browser, fully compatible
  with Cloudflare/GitHub Pages.
- **Graceful degradation** — on browsers where `FaceDetector` is unavailable
  (Firefox, Safari), the full uploaded photo is used as the overlay instead.
  The user can drag it to reposition manually.

---

## Known Limitations and Future Research

Pipeline C's approach is intentionally scoped to what is achievable within
the project's constraints. The following are documented limitations, not
oversights.

**No pixel-level face blending.** The user's face appears as a rectangular
crop composited onto the template. There is no hair masking, edge feathering,
or skin tone matching. The result looks like a deliberate cutout rather than
a seamless swap. This is a conscious trade-off: the alternative (proper face
blending) requires landmark detection, alpha masking, and significant
additional engineering.

**No head rotation or scale matching.** The cropped face is not rotated or
warped to match the angle of the meme character's head. For templates where
the character is facing forward, the result looks natural. For side-profile
or angled templates, it will look less convincing.

**`FaceDetector` browser support is limited.** Chrome and Edge on desktop
and Android support the API. Firefox and Safari do not. Pipeline C handles
this with a fallback, but the auto-crop experience is not universal.

**`imageZone` coordinates are manually labeled.** The placement zones in
`templates.json` were determined by hand. For a large template library,
this approach does not scale. Future work could use an LLM to generate
`imageZone` suggestions automatically as part of a template onboarding flow.

### Technologies Evaluated and Deferred

| Tool             | Reason deferred                                                              |
| ---------------- | ---------------------------------------------------------------------------- |
| InsightFace      | Requires Python server; 250ms+ latency; incompatible with browser deployment |
| Face2Face        | 300–500ms on GPU; server infrastructure required                             |
| FaceFusion       | Heavy model weights; GPU dependency; output degrades with bangs/glasses      |
| face-api.js      | Requires TA approval as a new dependency; adds bundle weight                 |
| MediaPipe (WASM) | Viable future option; deferred to keep this sprint dependency-free           |

---

## Relationship to the Broader Architecture

Pipeline C's output — `{ text, placement, imageZone, metadata }` — is
designed to be consumed directly by the frontend canvas layer
(`src/meme-canvas.js`). The frontend is responsible for all rendering;
the pipeline is responsible only for metadata and placement guidance.

This separation means that when Firebase replaces the local `templates.json`
store, only `resolveTemplate()` in `pipeline.js` changes. The rest of the
pipeline, the canvas compositing logic, and the frontend rendering layer all
remain untouched.

---

## Implementation History

### Issue #54 — Pipeline C scaffold

Created the initial Pipeline C folder structure with:

- `templates.json` — local meme template store with `context`, `text`, and
  `user_image` fields matching the planned Firestore schema
- `pipeline.js` — `generateMockMeme(template, userImage)` returning a mock
  response with hardcoded caption, placement, and metadata
- `pipeline.test.js` — node:test unit tests validating response shape
- `README.md` — documents the pipeline's LLM-first, context-driven strategy

### Issue #55 — Template ID resolution

Separated template lookup from generation logic:

- Added `resolveTemplate(templateId)` — the Firebase integration seam.
  Looks up a template from `templates.json` by ID. Throws `TypeError` for
  unknown or empty IDs. When Firestore replaces the JSON file, only this
  function changes.
- Refactored `generateMockMeme` signature from `(template, userImage)` to
  `({ templateId, userImage })` — matching the real frontend input contract.
- Expanded tests to cover valid lookups, unknown IDs, and empty strings.

### Issue #59 — imageZone placement metadata

Added face compositing support to the pipeline:

- Extended `templates.json` with an `imageZone` field per template —
  normalized (0..1) coordinates for the face region of each meme character.
  Coordinates were visually verified against the actual template images using
  a Python overlay script.
- `generateMockMeme` now returns `imageZone` in its response. Templates
  without a defined zone return `null`, allowing the frontend to fall back
  gracefully.
- Added `IMG_4` (two-buttons meme) as the primary test template — chosen
  because it has a single, front-facing face with no hair or accessory
  occlusion, making it the cleanest candidate for the face compositing MVP.
- Template reference images moved to `src/backend/pipelines/c/templates/`
  with descriptive names (`drake-approval.png`, `two-buttons.png`) so other
  teams can inspect them.
- Zone-check verification images (generated during calibration) are excluded
  from the repo via `.gitignore`.
- Tests expanded to assert `imageZone` shape, field types, and normalized
  coordinate bounds.
