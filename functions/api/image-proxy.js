/**
 * GET /api/image-proxy?url=<encoded-imgflip-url>
 *
 * Cloudflare Pages Function. Proxies meme template images from allowed CDN
 * hosts so the browser can draw them onto a canvas without CORS taint. Only
 * hosts in {@link ALLOWED_TEMPLATE_HOSTS} are forwarded — all others are
 * rejected (SSRF guard).
 *
 * Ported from the Express backend (src/backend/server.js) to the Cloudflare
 * Workers runtime: native `fetch`/`Response` instead of axios, no Node APIs.
 * See ADR 0008.
 */

// Allowed template URL hosts — restricts SSRF to known CDN origins.
export const ALLOWED_TEMPLATE_HOSTS = ["i.imgflip.com", "imgflip.com"];

const FETCH_TIMEOUT_MS = 30_000;

/**
 * Validate a requested proxy target. Pure (no network) so it can be unit
 * tested in Node. Returns `{ ok: true, url }` for an allowed target, or
 * `{ ok: false, status, error }` describing why it was rejected.
 *
 * @param {string | null | undefined} urlString
 * @returns {{ ok: true, url: string } | { ok: false, status: number, error: string }}
 */
export function validateTargetUrl(urlString) {
  if (!urlString) {
    return { ok: false, status: 400, error: "url query param is required" };
  }
  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    return { ok: false, status: 400, error: "url must be a valid URL" };
  }
  if (!ALLOWED_TEMPLATE_HOSTS.includes(parsed.hostname)) {
    return { ok: false, status: 403, error: `Host not allowed: ${parsed.hostname}` };
  }
  return { ok: true, url: parsed.toString() };
}

const jsonError = (status, error) =>
  new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/**
 * Cloudflare Pages Functions entry point for GET /api/image-proxy.
 *
 * @param {{ request: Request }} context
 * @returns {Promise<Response>}
 */
export async function onRequestGet({ request }) {
  const target = validateTargetUrl(new URL(request.url).searchParams.get("url"));
  if (!target.ok) return jsonError(target.status, target.error);

  try {
    const upstream = await fetch(target.url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!upstream.ok) return jsonError(502, "Failed to fetch image");

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return jsonError(502, "Failed to fetch image");
  }
}
