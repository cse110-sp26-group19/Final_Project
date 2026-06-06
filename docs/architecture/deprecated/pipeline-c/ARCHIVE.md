# Pipeline C — Archived

This folder contains the Pipeline C experimental implementation. It was not
selected as the final production backend path but is preserved here so
teammates, reviewers, and future maintainers can understand what was tried and
why.

---

## What Pipeline C tested

### 1. Template context metadata

Each meme template was manually labeled with a `context` field — a plain
English description of the meme's visual layout, tone, and text zones. This
context was designed to be sent to an LLM to generate a relevant caption
without the model needing to "see" the image.

### 2. Mock generation pipeline

`generateMockMeme` was built first — a function that returned a structured
response with no network calls. This let the team validate the pipeline's
input/output contract and write unit tests before any real API was wired in.

### 3. `imageZone` placement metadata

Each template was extended with normalized (0..1) coordinates marking the face
region of the meme character. The idea was that the frontend could use these
coordinates to know exactly where to place the user's cropped face on the
canvas.

### 4. Browser-native face crop and canvas compositing

Rather than a server-side face swap, Pipeline C originally planned to:

1. Use the browser's built-in `FaceDetector` API to detect the user's face
2. Crop it to a canvas element, entirely client-side
3. Composite the cropped face onto the meme template at the `imageZone`
   coordinates

No server, no dependencies, no GPU. Just browser code.

### 5. AILabTools AI Face Swap API integration

After testing browser compositing, the team found a hosted face swap API
(AILabTools) that produces seamless results with a simple HTTP request. This
was integrated as a stronger alternative — `face-swap.js` handles the full
async flow: submit a job, poll for the result, download the image.

---

## Why it was useful

- **Established the pipeline contract early.** The mock-first approach meant
  the team had a working, testable interface (`{ templateId, userImage }` →
  `{ image, text, placement, imageZone, metadata }`) before any real API was
  connected. Other pipelines could reference this contract.

- **Proved the metadata-first idea works.** Storing `context` and `imageZone`
  per template decouples caption generation from image rendering. The LLM never
  needs to see the image — it only needs the context label. This is a clean,
  testable architecture that scales to large template libraries.

- **Identified the limits of browser compositing.** By building the
  `imageZone` system and testing it, the team confirmed that a rectangular crop
  overlay does not look compelling enough. This finding justified the shift to a
  proper face swap API and is documented so future teams don't revisit the same
  dead end.

- **Found a deployment-compatible face swap path.** Pipeline B's FaceFusion
  approach required a GPU server, which is incompatible with the project's
  Cloudflare/GitHub Pages deployment constraint. Pipeline C found AILabTools — a
  hosted API that works with a single HTTP request and no server infrastructure.

- **All work is tested.** `pipeline.test.js` covers template resolution, input
  validation, `imageZone` shape, and normalized coordinate bounds. The test
  suite can be run against the archived code at any time.

---

## Why it was not selected as the final active pipeline

Browser-only compositing — the original approach — produced a rectangular crop
pasted onto the template rather than a seamless face blend. The visual result
was clearly a cutout, not a real face swap, and was not compelling enough for
the final product.

The AILabTools integration that replaced it works well for portrait-style
templates but has constraints that made it unsuitable as the single production
path:

- Only works when the template face is large and front-facing (small faces in
  multi-panel memes are not detected)
- Some templates are blocked by the API's content moderation filter
- The API key must be proxied server-side for production use, which adds
  infrastructure the team chose to handle differently in the final pipeline

The team shifted toward a production backend that handles face integration more
robustly across a wider range of template types.

---

## Related documentation

- `README.md` — full pipeline usage, setup, and file reference
- `docs/research/pipeline-c-approach.md` — research notes, trade-off analysis,
  and implementation history
- `docs/decisions/0002-pipeline-c-face-swap-approach.md` — ADR explaining the
  architectural decision to use AILabTools over other face swap approaches
