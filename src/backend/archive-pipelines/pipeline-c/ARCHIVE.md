# Pipeline C — Archived

This folder contains the Pipeline C experimental implementation. It was not
selected as the final production backend path but is preserved here for
reference.

## What this pipeline explored

- Template context metadata — each meme template labeled with a human-readable
  description used to guide LLM caption generation
- Mock meme generation — `generateMockMeme` returning structured output with no
  network calls, used to validate the pipeline contract early
- `imageZone` placement metadata — normalized (0..1) coordinates per template
  marking where the user's face should be placed on the canvas
- Browser-based face crop and canvas compositing — a fallback approach using the
  browser's built-in `FaceDetector` API and Canvas API to composite the user's
  cropped face onto the meme template client-side
- AILabTools AI Face Swap API integration — a hosted face swap API that takes
  a meme template and user photo and returns a swapped image via async polling

## Why it was archived

Browser-only compositing produced a rectangular crop overlay rather than a
seamless face blend, which was not visually compelling enough for the final
product. The team shifted toward a stronger face-swap API approach for
production.

The research and trade-off analysis from this pipeline is documented in:

- `docs/research/pipeline-c-approach.md`
- `docs/decisions/0002-pipeline-c-face-swap-approach.md`
