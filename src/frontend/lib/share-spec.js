/**
 * Encode a meme spec into a URL-safe base64 string. Handles unicode (emoji,
 * non-ASCII text) by routing through encodeURIComponent first.
 *
 * @param {object} spec
 * @returns {string}
 */
export function encodeSpec(spec) {
  return btoa(encodeURIComponent(JSON.stringify(spec)));
}

/**
 * Reverse of {@link encodeSpec}. Returns null if the param is missing or
 * malformed, so the caller can fall back to the next source.
 *
 * @param {string | null} param
 * @returns {object | null}
 */
export function decodeSpec(param) {
  if (!param) return null;
  try {
    return JSON.parse(decodeURIComponent(atob(param)));
  } catch {
    return null;
  }
}
