# 0006. Backend-frontend integration via Express proxy and sessionStorage handoff

| Attribute | Value                           |
| --------- | ------------------------------- |
| Date      | `2026-06-02`                    |
| Status    | Accepted                        |
| Deciders  | CSE 110 Group 19 (Backend Team) |

## Context

The Replicate face-swap client (`ReplicateClient`) existed in isolation — it could
call the API from Node.js but had no connection to the multi-page HTML frontend.
Three problems had to be solved simultaneously:

1. **Secret exposure** — `REPLICATE_API_TOKEN` must never reach the browser.
2. **Cross-page state** — the user's face photo is uploaded on step 1 (upload page)
   but only needed on step 3 (edit page, when "Generate" is clicked). The two pages
   are separate HTML documents with no shared in-memory state.
3. **API shape** — `ReplicateClient.generateSwap()` requires file paths on disk, but
   the browser delivers image data, not file paths.

## Decision

We will expose a single `POST /api/face-swap` endpoint on the Express server
(`src/backend/server.js`) that acts as the only bridge between the browser and
Replicate. The browser never holds or sees the API token.

**Client-side data flow:**
- Upload page converts the picked file to a base64 data URL via `FileReader` and
  stores it in `sessionStorage` under `memebro:face-photo`.
- Edit page reads that key on "Generate", POSTs `{ faceDataUrl, templateUrl }` as
  JSON to `POST /api/face-swap`, awaits the response, then adds `swappedImageUrl`
  to the meme spec before navigating to the result page.
- Result page checks `spec.swappedImageUrl`; if present it displays the swapped
  `<img>` instead of re-rendering the canvas.

**Server-side request handling:**
- Validates `faceDataUrl` MIME against an allowlist (`jpeg | png | webp`) — HEIC is
  rejected server-side because Replicate does not accept it.
- Validates `templateUrl` against `ALLOWED_TEMPLATE_HOSTS` (`imgflip.com`) to
  prevent SSRF — the server fetches the template image and converts it to base64
  before forwarding to Replicate.
- Calls `createPrediction` + `pollPrediction` + `downloadAndSaveImage` directly
  (bypassing `generateSwap`, which requires disk paths) to avoid temp-file
  management.
- Serves generated images at `/images/:filename` so the browser can display and
  download the result.
- CORS is locked to `localhost` origins only for local development.

## What We Considered and Skipped

- **Calling Replicate directly from the browser** — would expose the API token in
  client JS. Rejected on security grounds.
- **File upload via multipart/express-fileupload** — would require writing temp
  files before calling the client, and the browser already has the image as a blob.
  Base64 JSON is simpler here; the 10 MB body limit accommodates typical photos.
- **IndexedDB for cross-page photo storage** — more storage headroom than
  sessionStorage (~5 MB limit), but adds async complexity and a dependency.
  Typical face photos compressed to JPEG are well under 3 MB base64-encoded.
- **Uploading the photo eagerly on step 1** — POSTing during upload and returning a
  server-side session ID would eliminate the sessionStorage size risk, but adds
  server state and a round-trip on every photo selection, including abandoned ones.
- **localStorage instead of sessionStorage** — would persist the face photo across
  browser sessions, a privacy risk. sessionStorage is cleared automatically when
  the tab closes.

## Consequences

### Positives

- API token is never reachable from DevTools or network traffic.
- SSRF surface is limited to a fixed set of trusted hosts.
- Graceful degradation: if no face photo is present or the API call fails, the
  result page still renders the text-only meme canvas.
- No new runtime dependencies — Express, cors, axios, and dotenv were already
  installed.

### Negatives/tradeoffs

- Base64 encoding inflates image size by ~33%; a 3 MB photo becomes ~4 MB in
  sessionStorage and the POST body. May hit the sessionStorage 5–10 MB limit on
  large uncompressed images.
- The `API_SWAP_URL` is hardcoded to `http://localhost:3001` in `edit.js`. A
  production deployment would need an environment-aware base URL.
- HEIC photos (common on iPhone) cannot be face-swapped and show an error message
  instead; users must convert to JPG first.
- Polling is server-side and synchronous within the request — the HTTP connection
  stays open for up to 5 minutes. A webhook or SSE pattern would be more robust
  for production.

### Follow-up

- [ ] Replace hardcoded `localhost:3001` in `edit.js` with a build-time or
      runtime-injected base URL for production deploys.
- [ ] Add client-side HEIC → JPEG conversion (e.g. `heic2any`) so iPhone uploads
      work end-to-end without a manual conversion step.
- [ ] Consider compressing the face image client-side (canvas `toBlob` at 0.8
      quality) before storing in sessionStorage to stay within the size limit.
- [ ] Replace long-poll HTTP with SSE or a webhook for the Replicate result so
      the connection does not stay open for the full prediction duration.
