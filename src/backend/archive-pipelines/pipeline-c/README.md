# Pipeline C — Context-Driven Meme Generation

Pipeline C is an experimental backend prototype for MemeBro's AI-assisted
meme generation flow. It is one of three competing pipelines (A, B, C) being
built in parallel this sprint.

## What This Pipeline Does

Pipeline C uses a two-part approach:

1. **Face Swap via AILabTools** — calls the AILabTools AI Face Swap API to
   replace the face in a meme template with the user's uploaded photo. No GPU,
   no running server, no new npm dependencies. Works with a simple `POST`
   request proxied through a Cloudflare Worker.
2. **Context-Driven Metadata** — each template carries a `context` field
   (sent to an LLM for caption generation) and an `imageZone` field (normalized
   coordinates for canvas compositing fallback).

## Why This Approach

Other pipelines explored FaceFusion (GPU required, can't deploy to
Cloudflare/GitHub Pages) and Replicate.com face swap (requires a running
Express server). Pipeline C uses AILabTools' hosted API — no infrastructure,
no server to maintain, just an API call.

## Setup

1. Copy `.env.example` to `.env` at the project root:

   ```bash
   cp .env.example .env
   ```

2. Add your AILabTools API key to `.env`:

   ```
   AILAB_API_KEY=your_key_here
   ```

   Get a key at https://www.ailabtools.com/developer-platform

## Running the Face Swap

```bash
node --env-file=.env src/backend/pipelines/c/run-swap.js
```

This swaps the face from `templates/stock image.jpg` onto the
`templates/kurt template.jpeg` scene and saves the result to
`images-generated/swapped_<timestamp>.png`.

## Running Tests

```bash
node --test src/backend/pipelines/c/pipeline.test.js
```

## Files

| File                | Purpose                                                            |
| ------------------- | ------------------------------------------------------------------ |
| `pipeline.js`       | Core logic — `resolveTemplate`, `generateMockMeme`, `generateMeme` |
| `face-swap.js`      | AILabTools API wrapper — submit, poll, download                    |
| `run-swap.js`       | Local test runner (equivalent to Pipeline B's `test-swap.js`)      |
| `pipeline.test.js`  | Unit tests using `node:test`                                       |
| `templates.json`    | Local meme template store (Firestore stand-in)                     |
| `templates/`        | Reference images for face swap and imageZone calibration           |
| `images-generated/` | Output folder for face swap results                                |

## API Field Reference

The AILabTools face swap API uses these fields:

| Field            | Role                                                |
| ---------------- | --------------------------------------------------- |
| `image_target`   | The meme template — the face that gets **replaced** |
| `image_template` | The user's photo — the face that gets **inserted**  |

## Current Output Shape

`generateMockMeme` (no API call, safe for tests):

```json
{
  "image": null,
  "text": "caption text",
  "placement": { "zone": "top-right", "x": 0.65, "y": 0.25 },
  "imageZone": { "x": 0.38, "y": 0.56, "w": 0.24, "h": 0.26 },
  "metadata": { "pipeline": "c", "source": "mock", "templateContext": "..." }
}
```

`generateMeme` (real face swap, requires `AILAB_API_KEY`):

```json
{
  "image": "/absolute/path/to/images-generated/swapped_<timestamp>.png",
  "text": null,
  "placement": null,
  "imageZone": null,
  "metadata": { "pipeline": "c", "source": "ailab-face-swap", "templateContext": "..." }
}
```

## Templates with Face Swap Support

| Template ID | Image                | Face Swap             |
| ----------- | -------------------- | --------------------- |
| `KURT`      | `kurt template.jpeg` | ✅ yes                |
| `IRONMAN`   | `ironman.jpg`        | ✅ yes                |
| `IMG_1`     | `drake-approval.png` | ❌ faces too small    |
| `IMG_2`     | —                    | ❌ not yet            |
| `IMG_3`     | —                    | ❌ not yet            |
| `IMG_4`     | `two-buttons.png`    | ❌ content moderation |

## Status

- Mock pipeline with local template resolution — **complete**
- `imageZone` placement metadata — **complete**
- AILabTools face swap integration — **complete**
- Real LLM caption generation — planned
- Cloudflare Worker proxy for API key — planned
- Firebase/Firestore integration — planned (post pipeline selection)
