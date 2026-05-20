# Pipeline C — Context-Driven Meme Generation

Pipeline C is an experimental backend prototype for MemeBro's AI-assisted
meme generation flow. It is one of three competing pipelines (A, B, C) being
built in parallel this sprint.

## What This Pipeline Does

Instead of server-side face swapping, Pipeline C takes a metadata-first
approach:

1. Each meme template is labeled with a `context` description and an
   `imageZone` — the normalized region where a user's face should be placed.
2. The pipeline resolves a template by ID, then returns caption text,
   placement coordinates, and `imageZone` metadata.
3. The frontend uses `imageZone` to composite the user's cropped face onto
   the meme canvas using the browser's native `FaceDetector` API.

## Why This Approach

Other pipelines explored FaceFusion and InsightFace for server-side face
swapping. Both approaches hit GPU/latency constraints and are incompatible
with the project's Cloudflare/GitHub Pages deployment requirement.

Pipeline C avoids those problems entirely by keeping face detection and
compositing in the browser — no new dependencies, no server round trip, no
TA approval needed.

## Files

| File               | Purpose                                                  |
| ------------------ | -------------------------------------------------------- |
| `pipeline.js`      | Core pipeline logic — template lookup and mock response  |
| `pipeline.test.js` | Unit tests using node:test                               |
| `templates.json`   | Local meme template store (Firestore stand-in)           |
| `templates/`       | Reference images used to calibrate imageZone coordinates |

## Running Tests

```bash
node --test src/backend/pipelines/c/pipeline.test.js
```

## Current Output Shape

```json
{
  "image": null,
  "text": "caption text",
  "placement": { "zone": "top-right", "x": 0.65, "y": 0.25 },
  "imageZone": { "x": 0.38, "y": 0.56, "w": 0.24, "h": 0.26 },
  "metadata": {
    "pipeline": "c",
    "source": "mock",
    "templateContext": "...",
    "userImage": "..."
  }
}
```

`imageZone` coordinates are normalized (0..1) and match the coordinate system
used by `src/meme-canvas.js`. Templates without a defined zone return `null`.

## Status

- Mock pipeline with local template resolution — complete
- `imageZone` placement metadata — complete
- Real LLM caption generation — planned
- HTTP endpoint wrapper — planned
- Firebase/Firestore integration — planned (post pipeline selection)

## Related Docs

- [`docs/research/pipeline-c-approach.md`](../../../docs/research/pipeline-c-approach.md) — full research, trade-off analysis, and implementation history
