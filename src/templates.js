/**
 * Meme template fetcher with localStorage caching.
 *
 * Pulls the top meme templates from the public Imgflip /get_memes endpoint and
 * caches the response so the network call only happens once per cache window.
 */

const IMGFLIP_GET_MEMES_URL = "https://api.imgflip.com/get_memes";
const CACHE_KEY = "memebro:imgflip-templates";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Fetch the top meme templates from Imgflip, caching the result in
 * localStorage to avoid redundant network calls.
 *
 * On a cache hit within the TTL window the cached value is returned and no
 * request is made. On a cache miss (or stale entry) the endpoint is queried,
 * the response is validated, and the parsed `memes` array is written back to
 * the cache before being returned.
 *
 * @param {Object} [options]
 * @param {boolean} [options.forceRefresh=false] - Bypass the cache and refetch.
 * @param {Storage} [options.storage] - Storage backend (defaults to localStorage).
 * @param {typeof fetch} [options.fetchFn] - Fetch implementation (defaults to global fetch).
 * @param {number} [options.now] - Current timestamp in ms (for testability).
 * @returns {Promise<Array<{id: string, name: string, url: string, width: number, height: number, box_count: number}>>}
 *   The array of meme template objects as returned by Imgflip.
 * @throws {Error} If the Imgflip response is missing, non-OK, or marked unsuccessful.
 */
export async function getTemplates(options = {}) {
  const {
    forceRefresh = false,
    storage = typeof localStorage !== "undefined" ? localStorage : null,
    fetchFn = typeof fetch !== "undefined" ? fetch : null,
    now = Date.now(),
  } = options;

  if (!forceRefresh && storage) {
    const cached = readCache(storage, now);
    if (cached) return cached;
  }

  if (!fetchFn) {
    throw new Error("getTemplates: no fetch implementation available");
  }

  const response = await fetchFn(IMGFLIP_GET_MEMES_URL);
  if (!response.ok) {
    throw new Error(`getTemplates: Imgflip returned HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (!payload || payload.success !== true || !payload.data || !Array.isArray(payload.data.memes)) {
    throw new Error("getTemplates: malformed Imgflip response");
  }

  const memes = payload.data.memes;
  if (storage) writeCache(storage, memes, now);
  return memes;
}

/**
 * Read and validate the cached templates entry.
 *
 * @param {Storage} storage
 * @param {number} now
 * @returns {Array|null} The cached memes array, or null if missing/stale/corrupt.
 */
function readCache(storage, now) {
  const raw = storage.getItem(CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.timestamp !== "number" || !Array.isArray(parsed.memes)) {
      return null;
    }
    if (now - parsed.timestamp > CACHE_TTL_MS) return null;
    return parsed.memes;
  } catch {
    return null;
  }
}

/**
 * Write the cache envelope to storage.
 *
 * @param {Storage} storage
 * @param {Array} memes
 * @param {number} now
 */
function writeCache(storage, memes, now) {
  try {
    storage.setItem(CACHE_KEY, JSON.stringify({ timestamp: now, memes }));
  } catch {
    // Storage may be full or disabled (private browsing); cache is best-effort.
  }
}

export const __testing = { CACHE_KEY, CACHE_TTL_MS, IMGFLIP_GET_MEMES_URL };
