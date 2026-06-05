/**
 * Edit page (Step 3 of 3) controller.
 *
 * Reads the selected template id from the URL, fetches its metadata via the
 * cached Imgflip module, loads the template image, and renders a live canvas
 * preview using drawMeme. Side-panel text inputs are bound to text overlays;
 * typing or dragging a box on the preview re-renders in real time. Hitting
 * Generate stores the meme spec in sessionStorage and navigates to the
 * Result page, which re-renders at export quality.
 */

import { getTemplates } from "../templates.js";
import { loadImage } from "../image-loader.js";
import { drawMeme } from "../meme-canvas.js";

const STORAGE_KEY = "memebro:current-meme";
const FACE_KEY = "memebro:face-photo";
const API_SWAP_URL = `${window.location.origin}/api/face-swap`;
const API_PROXY_URL = `${window.location.origin}/api/image-proxy`;
const HIT_RADIUS = 0.1; // normalized distance threshold for drag pickup

const elements = {
  canvas: document.getElementById("preview-canvas"),
  status: document.getElementById("preview-status"),
  frame: document.getElementById("preview-frame"),
  inputs: document.getElementById("edit-inputs"),
  generateBtn: document.getElementById("generate-btn"),
};

const state = {
  template: null,
  image: null,
  textBoxes: [],
  draggingIndex: -1,
};

/**
 * Route a template image URL through the local proxy so the canvas load is
 * same-origin, bypassing Imgflip CDN CORS restrictions without tainting the
 * canvas for later PNG export.
 *
 * @param {string} url
 * @returns {string}
 */
function proxyImageUrl(url) {
  return `${API_PROXY_URL}?url=${encodeURIComponent(url)}`;
}

/**
 * Read the templateId query param from the current URL.
 *
 * @returns {string | null}
 */
function getTemplateIdFromUrl() {
  return new URLSearchParams(window.location.search).get("templateId");
}

/**
 * Build default normalized positions for a template with N text boxes:
 * first near the top, last near the bottom, intermediate boxes spaced
 * evenly in between.
 *
 * @param {number} count
 * @returns {Array<{text: string, x: number, y: number}>}
 */
function defaultTextBoxes(count) {
  const safeCount = Math.max(1, count);
  if (safeCount === 1) return [{ text: "", x: 0.5, y: 0.5 }];

  const boxes = [];
  for (let i = 0; i < safeCount; i++) {
    const y = 0.1 + (0.8 * i) / (safeCount - 1);
    boxes.push({ text: "", x: 0.5, y });
  }
  return boxes;
}

/**
 * Friendly label for a text box: "Top text" for the first, "Bottom text"
 * for the last, "Text N" for any in between.
 *
 * @param {number} index
 * @param {number} total
 * @returns {string}
 */
function labelForBox(index, total) {
  if (index === 0) return "Top text";
  if (index === total - 1) return "Bottom text";
  return `Text ${index + 1}`;
}

/**
 * Render the side-panel inputs for the current set of text boxes.
 */
function renderInputs() {
  elements.inputs.replaceChildren();

  state.textBoxes.forEach((box, index) => {
    const group = document.createElement("div");
    group.className = "edit-input-group";

    const label = document.createElement("label");
    label.className = "edit-input-group__label";
    label.htmlFor = `text-input-${index}`;
    label.textContent = labelForBox(index, state.textBoxes.length);

    const input = document.createElement("input");
    input.className = "edit-input";
    input.id = `text-input-${index}`;
    input.type = "text";
    input.placeholder = "Edit this";
    input.value = box.text;
    input.addEventListener("input", () => {
      state.textBoxes[index].text = input.value;
      renderPreview();
    });

    group.append(label, input);
    elements.inputs.appendChild(group);
  });
}

/**
 * Re-render the preview canvas with the current text boxes.
 */
function renderPreview() {
  if (!state.image) return;
  drawMeme(elements.canvas, state.image, state.textBoxes);
}

/**
 * Translate a mouse or touch event into normalized (0..1) coordinates
 * within the canvas's displayed area.
 *
 * @param {MouseEvent} event
 * @returns {{x: number, y: number}}
 */
function eventToNormalized(event) {
  const rect = elements.canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / rect.width,
    y: (event.clientY - rect.top) / rect.height,
  };
}

/**
 * Find the index of the text box closest to the given normalized point,
 * provided it falls within HIT_RADIUS. Returns -1 if no box is close enough.
 *
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function findBoxAt(x, y) {
  let closest = -1;
  let bestDistance = HIT_RADIUS;
  state.textBoxes.forEach((box, index) => {
    const dx = box.x - x;
    const dy = box.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < bestDistance) {
      closest = index;
      bestDistance = distance;
    }
  });
  return closest;
}

/**
 * Wire up canvas mouse events for drag-to-reposition of text overlays.
 */
function bindDragHandlers() {
  elements.canvas.addEventListener("mousedown", (event) => {
    const { x, y } = eventToNormalized(event);
    state.draggingIndex = findBoxAt(x, y);
  });

  window.addEventListener("mousemove", (event) => {
    if (state.draggingIndex < 0) return;
    const { x, y } = eventToNormalized(event);
    const box = state.textBoxes[state.draggingIndex];
    box.x = Math.max(0, Math.min(1, x));
    box.y = Math.max(0, Math.min(1, y));
    renderPreview();
  });

  window.addEventListener("mouseup", () => {
    state.draggingIndex = -1;
  });
}

/**
 * Call the backend face-swap API if the user uploaded a face photo.
 * Returns the swapped image URL on success, or null if no photo was uploaded
 * or if the API call fails (so the result page still shows the text meme).
 *
 * @param {string} templateUrl Imgflip CDN URL of the selected template
 * @returns {Promise<string|null>}
 */
async function requestFaceSwap(templateUrl) {
  const faceDataUrl = sessionStorage.getItem(FACE_KEY);
  if (!faceDataUrl) return null;

  if (faceDataUrl.startsWith("data:image/heic")) {
    throw new Error("HEIC photos aren't supported for face swap. Convert to JPG first.");
  }

  const response = await fetch(API_SWAP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ faceDataUrl, templateUrl }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Server returned ${response.status}`);
  }

  return data.outputUrl;
}

/**
 * Show or clear a status message below the generate button.
 * Pass isError=true to render in the error colour.
 *
 * @param {string} message
 * @param {boolean} [isError]
 */
function showSwapStatus(message, isError = false) {
  const statusEl = document.getElementById("swap-status");
  statusEl.textContent = message;
  statusEl.classList.toggle("edit-swap-status--error", isError);
  statusEl.hidden = !message;
}

/**
 * Persist the current meme spec to sessionStorage and navigate to the
 * Result page, which is responsible for re-rendering and offering export.
 * If a face photo is stored, calls the backend swap API first and embeds
 * the swapped image URL in the spec.
 */
function setGenerating(active) {
  elements.generateBtn.disabled = active;
  elements.generateBtn.setAttribute("aria-disabled", String(active));
  elements.generateBtn.textContent = active ? "Generating…" : "Generate →";
}

async function generate() {
  if (!state.template) return;

  setGenerating(true);

  let swappedImageUrl = null;
  try {
    showSwapStatus("Swapping face… this takes ~15 seconds.");
    swappedImageUrl = await requestFaceSwap(state.template.url);
    showSwapStatus("");
  } catch (error) {
    console.error("Face swap failed:", error);
    showSwapStatus(`${error.message}. Saving text-only meme.`, true);
    setGenerating(false);
  }

  const spec = {
    templateUrl: state.template.url,
    templateName: state.template.name,
    textBoxes: state.textBoxes,
    swappedImageUrl: swappedImageUrl ?? undefined,
  };

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(spec));
  window.location.href = "result.html";
}

/**
 * Page entry point — pull template metadata, load the image, prime state,
 * and wire up inputs + drag + generate.
 */
async function init() {
  const templateId = getTemplateIdFromUrl();
  if (!templateId) {
    window.location.replace("templates.html");
    return;
  }

  try {
    const templates = await getTemplates();
    state.template = templates.find((t) => t.id === templateId);
    if (!state.template) {
      throw new Error(`Template ${templateId} not found`);
    }

    state.image = await loadImage(proxyImageUrl(state.template.url));
    state.textBoxes = defaultTextBoxes(state.template.box_count ?? 2);

    elements.status.hidden = true;
    elements.canvas.classList.add("is-loaded");
    renderInputs();
    renderPreview();
    bindDragHandlers();
    setGenerating(false);
    elements.generateBtn.addEventListener("click", generate);
  } catch (error) {
    console.error("Failed to load editor:", error);
    elements.frame.classList.add("is-error");
    elements.status.textContent = "Failed to load template. Please go back and try another.";
  }
}

init();
