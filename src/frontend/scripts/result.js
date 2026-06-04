/**
 * Result page controller.
 *
 * Renders the final meme on a canvas using the spec the Edit page handed off
 * via sessionStorage (or, for shared links, a base64-encoded `spec` URL
 * param). Wires up Download (PNG export via exportMeme), Share (copies a
 * shareable URL to the clipboard), and Make another (clears state and goes
 * home).
 *
 * Known limitation: Imgflip's CDN does not send CORS headers, so the canvas
 * may be tainted. exportMeme will throw SecurityError in that case; we catch
 * it and surface a friendly toast asking the user to right-click the image
 * instead.
 */

import { loadImage } from "../../image-loader.js";
import { drawMeme } from "../../meme-canvas.js";
import { exportMeme } from "../../export.js";

const STORAGE_KEY = "memebro:current-meme";
const TOAST_TIMEOUT_MS = 2500;
const API_PROXY_URL = `${window.location.origin}/api/image-proxy`;

function proxyImageUrl(url) {
  return `${API_PROXY_URL}?url=${encodeURIComponent(url)}`;
}

const elements = {
  canvas: document.getElementById("result-canvas"),
  swapped: document.getElementById("result-swapped"),
  frame: document.getElementById("result-frame"),
  status: document.getElementById("result-status"),
  downloadBtn: document.getElementById("download-btn"),
  shareBtn: document.getElementById("share-btn"),
  restartBtn: document.getElementById("restart-btn"),
  toast: document.getElementById("result-toast"),
};

const state = {
  spec: null,
};

let toastTimer = null;

/**
 * Encode a meme spec into a URL-safe base64 string. Handles unicode (emoji,
 * non-ASCII text) by routing through encodeURIComponent first.
 *
 * @param {object} spec
 * @returns {string}
 */
function encodeSpec(spec) {
  return btoa(encodeURIComponent(JSON.stringify(spec)));
}

/**
 * Reverse of {@link encodeSpec}. Returns null if the param is missing or
 * malformed, so the caller can fall back to the next source.
 *
 * @param {string | null} param
 * @returns {object | null}
 */
function decodeSpec(param) {
  if (!param) return null;
  try {
    return JSON.parse(decodeURIComponent(atob(param)));
  } catch {
    return null;
  }
}

/**
 * Resolve the meme spec for this page. Tries the `spec` URL param first (so
 * shared links work for anyone), then falls back to the sessionStorage entry
 * the Edit page wrote.
 *
 * @returns {object | null}
 */
function readSpec() {
  const urlSpec = decodeSpec(new URLSearchParams(window.location.search).get("spec"));
  if (urlSpec) return urlSpec;

  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Build the shareable URL for the current spec — the page URL plus an encoded
 * `spec` param. The URL is enough to re-render the same meme on someone else's
 * machine (no sessionStorage required).
 *
 * @returns {string}
 */
function buildShareUrl() {
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("spec", encodeSpec(state.spec));
  return url.toString();
}

/**
 * Show a transient toast message at the bottom of the page. Pass `isError`
 * to render it in the error color.
 *
 * @param {string} message
 * @param {{ isError?: boolean }} [options]
 */
function showToast(message, { isError = false } = {}) {
  elements.toast.textContent = message;
  elements.toast.classList.toggle("is-error", isError);
  elements.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    elements.toast.hidden = true;
  }, TOAST_TIMEOUT_MS);
}

/**
 * Trigger a PNG download of the final meme.
 *
 * When a face-swapped image is shown, fetch it and force a download via a
 * temporary <a> tag (avoids the CORS taint that affects canvas.toBlob).
 * Otherwise fall back to the existing canvas exportMeme path.
 */
async function downloadMeme() {
  const filename = state.spec.templateName
    ? `${state.spec.templateName.replace(/\s+/g, "-").toLowerCase()}.png`
    : "meme.png";

  if (state.spec.swappedImageUrl) {
    try {
      // The swapped image is served from localhost so fetch is allowed.
      const response = await fetch(state.spec.swappedImageUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
      showToast("Saved to your downloads.");
    } catch (error) {
      console.error("Swapped image download failed:", error);
      showToast("Download failed. Right-click the image to save it.", { isError: true });
    }
    return;
  }

  // Fallback: canvas-based export for text-only memes.
  try {
    await exportMeme(elements.canvas, filename);
    showToast("Saved to your downloads.");
  } catch (error) {
    console.error("Download failed:", error);
    showToast("Download blocked by the template host. Right-click the image to save it.", {
      isError: true,
    });
  }
}

/**
 * Copy the shareable URL to the clipboard.
 */
async function copyShareLink() {
  const url = buildShareUrl();
  try {
    await navigator.clipboard.writeText(url);
    showToast("Link copied to your clipboard.");
  } catch (error) {
    console.error("Clipboard write failed:", error);
    showToast("Couldn't copy automatically — select the URL bar to copy manually.", {
      isError: true,
    });
  }
}

/**
 * Clear the persisted spec so the next visit doesn't reuse this meme.
 */
function clearStoredSpec() {
  sessionStorage.removeItem(STORAGE_KEY);
}

/**
 * Wire up button handlers.
 */
function bindEvents() {
  elements.downloadBtn.addEventListener("click", downloadMeme);
  elements.shareBtn.addEventListener("click", copyShareLink);
  elements.restartBtn.addEventListener("click", clearStoredSpec);
}

/**
 * Page entry point — read the spec, render the meme, enable the actions.
 */
async function init() {
  const spec = readSpec();
  if (!spec || !spec.templateUrl) {
    window.location.replace("../index.html");
    return;
  }
  state.spec = spec;

  try {
    if (spec.swappedImageUrl) {
      // Show the AI face-swapped image instead of re-rendering the canvas.
      elements.swapped.src = spec.swappedImageUrl;
      elements.swapped.classList.add("is-loaded");
    } else {
      const image = await loadImage(proxyImageUrl(spec.templateUrl));
      drawMeme(elements.canvas, image, spec.textBoxes ?? []);
      elements.canvas.classList.add("is-loaded");
    }

    elements.status.hidden = true;

    elements.downloadBtn.disabled = false;
    elements.downloadBtn.setAttribute("aria-disabled", "false");
    elements.shareBtn.disabled = false;
    elements.shareBtn.setAttribute("aria-disabled", "false");

    bindEvents();
  } catch (error) {
    console.error("Failed to render meme:", error);
    elements.frame.classList.add("is-error");
    elements.status.textContent = "Failed to render meme. Try generating it again.";
  }
}

init();
