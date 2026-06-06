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

import { loadImage } from "../image-loader.js";
import { drawMeme } from "../meme-canvas.js";
import { exportMeme } from "../export.js";

const STORAGE_KEY = "memebro:current-meme";
const TOAST_TIMEOUT_MS = 2500;
const API_PROXY_URL = `${window.location.origin}/api/image-proxy`;

const RESULT_PHRASES = [
  "Loading meme…",
  "Rendering your masterpiece…",
  "Adding the finishing touches…",
  "Almost ready…",
];

function proxyImageUrl(url) {
  return `${API_PROXY_URL}?url=${encodeURIComponent(url)}`;
}

const elements = {
  canvas: document.getElementById("result-canvas"),
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
 * Trigger a PNG download of the final meme from the canvas.
 *
 * Both text-only and face-swapped memes are rendered onto the same canvas
 * (with text overlaid), so a single canvas export path handles both cases.
 * The canvas is same-origin for all image sources so toBlob() is never tainted.
 */
async function downloadMeme() {
  const filename = state.spec.templateName
    ? `${state.spec.templateName.replace(/\s+/g, "-").toLowerCase()}.png`
    : "meme.png";

  try {
    await exportMeme(elements.canvas, filename);
    showToast("Saved to your downloads.");
  } catch (error) {
    console.error("Download failed:", error);
    showToast("Download failed. Right-click the image to save it.", { isError: true });
  }
}

/**
 * Share the URL. On platforms with the Web Share API (most mobile browsers
 * and some desktop ones), open the native share sheet. Everywhere else,
 * fall back to copying the link to the clipboard.
 */
async function copyShareLink() {
  const url = buildShareUrl();

  if (typeof navigator.share === "function") {
    const shareText = state.spec.templateName
      ? `Check out my "${state.spec.templateName}" meme`
      : "Check out my meme";
    try {
      await navigator.share({ title: "Memebro", text: shareText, url });
      return;
    } catch (error) {
      // User dismissed the share sheet — leave the page quiet.
      if (error.name === "AbortError") return;
      // Any other failure falls through to the clipboard path below.
      console.warn("Web Share failed, falling back to clipboard:", error);
    }
  }

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
function startPhrases(textElId, phrases) {
  let i = 0;
  const el = document.getElementById(textElId);
  el.textContent = phrases[i];
  return setInterval(() => {
    i = (i + 1) % phrases.length;
    el.textContent = phrases[i];
  }, 3000);
}

async function init() {
  const spec = readSpec();
  if (!spec || !spec.templateUrl) {
    window.location.replace("../index.html");
    return;
  }
  state.spec = spec;

  const phraseInterval = startPhrases("result-status-text", RESULT_PHRASES);

  try {
    // Use swapped face image when available, otherwise proxy the template.
    // Both paths go through drawMeme so text boxes are always rendered on top.
    const imageUrl = spec.swappedImageUrl ?? proxyImageUrl(spec.templateUrl);
    const image = await loadImage(imageUrl);
    drawMeme(elements.canvas, image, spec.textBoxes ?? []);
    elements.canvas.classList.add("is-loaded");

    clearInterval(phraseInterval);
    elements.status.hidden = true;

    elements.downloadBtn.disabled = false;
    elements.downloadBtn.setAttribute("aria-disabled", "false");
    elements.shareBtn.disabled = false;
    elements.shareBtn.setAttribute("aria-disabled", "false");

    bindEvents();
  } catch (error) {
    clearInterval(phraseInterval);
    console.error("Failed to render meme:", error);
    elements.frame.classList.add("is-error");
    elements.status.textContent = "Failed to render meme. Try generating it again.";
  }
}

init();
