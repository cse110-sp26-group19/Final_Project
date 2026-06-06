/**
 * POST /api/face-swap   { faceDataUrl, templateUrl } → { outputUrl }
 *
 * Cloudflare Pages Function. Proxies a face-swap request to the Replicate API,
 * keeping REPLICATE_API_TOKEN server-side (read from the Cloudflare env
 * binding, never shipped to the browser).
 *
 * Ported from the Express backend (src/backend/server.js + replicate-client.js)
 * to the Workers runtime: native fetch instead of axios, and — because Workers
 * have no filesystem — the swapped image is returned as a base64 data URL
 * rather than saved to disk and served from /images. A data URL is same-origin
 * and canvas-safe, so the result page can render and export it without taint.
 * See ADR 0008.
 */

// Allowed template source hosts — restricts SSRF to known CDN origins.
export const ALLOWED_TEMPLATE_HOSTS = ["i.imgflip.com", "imgflip.com"];

// Allowed face-image MIME types. HEIC is excluded — Replicate does not accept it.
export const ALLOWED_FACE_MIME = /^data:image\/(jpeg|png|webp);base64,/;

const MODEL_VERSION = "278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34";
const REPLICATE_API = "https://api.replicate.com/v1";
const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 290_000;

/**
 * Validate the request body. Pure (no network) so it can be unit tested in
 * Node. Returns `{ ok: true }` or `{ ok: false, status, error }`.
 *
 * @param {{ faceDataUrl?: string, templateUrl?: string }} body
 * @returns {{ ok: true } | { ok: false, status: number, error: string }}
 */
export function validateFaceSwapInput(body) {
  const { faceDataUrl, templateUrl } = body ?? {};

  if (!faceDataUrl || !ALLOWED_FACE_MIME.test(faceDataUrl)) {
    return {
      ok: false,
      status: 400,
      error: "faceDataUrl must be a base64 data URL (JPEG, PNG, or WebP).",
    };
  }
  if (!templateUrl || !/^https?:\/\/.+/.test(templateUrl)) {
    return { ok: false, status: 400, error: "templateUrl must be a valid HTTP(S) URL." };
  }
  let host;
  try {
    host = new URL(templateUrl).hostname;
  } catch {
    return { ok: false, status: 400, error: "templateUrl must be a valid HTTP(S) URL." };
  }
  if (!ALLOWED_TEMPLATE_HOSTS.includes(host)) {
    return { ok: false, status: 403, error: `Template host not allowed: ${host}` };
  }
  return { ok: true };
}

const jsonResponse = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Start a Replicate prediction and return its id.
 * @param {string} token
 * @param {{ inputImage: string, swapImage: string }} input
 * @returns {Promise<string>}
 */
async function createPrediction(token, { inputImage, swapImage }) {
  const response = await fetch(`${REPLICATE_API}/predictions`, {
    method: "POST",
    headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      version: MODEL_VERSION,
      input: { input_image: inputImage, swap_image: swapImage },
    }),
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error("Invalid Replicate API token");
    if (response.status === 402) throw new Error("Insufficient Replicate credits");
    if (response.status === 429) throw new Error("Rate limited by Replicate — try again later");
    throw new Error(`Replicate create failed: ${response.status}`);
  }
  return (await response.json()).id;
}

/**
 * Poll a prediction until it reaches a terminal state or times out.
 * @param {string} token
 * @param {string} id
 * @returns {Promise<{ status: string, output?: string }>}
 */
async function pollPrediction(token, id) {
  const start = Date.now();
  while (Date.now() - start < POLL_TIMEOUT_MS) {
    const response = await fetch(`${REPLICATE_API}/predictions/${id}`, {
      headers: { Authorization: `Token ${token}` },
    });
    if (!response.ok) throw new Error(`Replicate poll failed: ${response.status}`);
    const prediction = await response.json();
    if (["succeeded", "failed", "canceled"].includes(prediction.status)) return prediction;
    await delay(POLL_INTERVAL_MS);
  }
  throw new Error("Replicate polling timed out");
}

/** Convert an ArrayBuffer to a base64 string in chunks (avoids call-stack limits). */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

/** Fetch the Replicate output image and return it as a same-origin data URL. */
async function fetchAsDataUrl(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download swapped image: ${response.status}`);
  const contentType = response.headers.get("content-type") ?? "image/png";
  const base64 = arrayBufferToBase64(await response.arrayBuffer());
  return `data:${contentType};base64,${base64}`;
}

/**
 * Cloudflare Pages Functions entry point for POST /api/face-swap.
 *
 * @param {{ request: Request, env: { REPLICATE_API_TOKEN?: string } }} context
 * @returns {Promise<Response>}
 */
export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: "Request body must be JSON." });
  }

  const valid = validateFaceSwapInput(body);
  if (!valid.ok) return jsonResponse(valid.status, { error: valid.error });

  const token = env.REPLICATE_API_TOKEN;
  if (!token) return jsonResponse(500, { error: "Server is missing REPLICATE_API_TOKEN." });

  try {
    const id = await createPrediction(token, {
      inputImage: body.templateUrl,
      swapImage: body.faceDataUrl,
    });
    const prediction = await pollPrediction(token, id);
    if (prediction.status !== "succeeded") {
      return jsonResponse(500, { error: `Face swap ${prediction.status}.` });
    }
    const outputUrl = await fetchAsDataUrl(prediction.output);
    return jsonResponse(200, { outputUrl });
  } catch (error) {
    return jsonResponse(500, { error: error.message });
  }
}
