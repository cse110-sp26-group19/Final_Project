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

import { getTemplates } from "../../templates.js";
import { loadImage } from "../../image-loader.js";
import { drawMeme } from "../../meme-canvas.js";

const STORAGE_KEY = "memebro:current-meme";
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
 * Pull clientX/clientY from either a MouseEvent or a TouchEvent. For touch
 * events the first active touch (or first changed touch on touchend) is used.
 *
 * @param {MouseEvent | TouchEvent} event
 * @returns {{ clientX: number, clientY: number }}
 */
function getClientCoords(event) {
  if (event.touches && event.touches.length > 0) {
    return { clientX: event.touches[0].clientX, clientY: event.touches[0].clientY };
  }
  if (event.changedTouches && event.changedTouches.length > 0) {
    return {
      clientX: event.changedTouches[0].clientX,
      clientY: event.changedTouches[0].clientY,
    };
  }
  return { clientX: event.clientX, clientY: event.clientY };
}

/**
 * Translate a mouse or touch event into normalized (0..1) coordinates
 * within the canvas's displayed area.
 *
 * @param {MouseEvent | TouchEvent} event
 * @returns {{x: number, y: number}}
 */
function eventToNormalized(event) {
  const rect = elements.canvas.getBoundingClientRect();
  const { clientX, clientY } = getClientCoords(event);
  return {
    x: (clientX - rect.left) / rect.width,
    y: (clientY - rect.top) / rect.height,
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
 * Wire up canvas mouse and touch events for drag-to-reposition of text
 * overlays. The same three handlers handle both input types so behavior is
 * identical on desktop (mouse) and mobile (touch).
 */
function bindDragHandlers() {
  const onStart = (event) => {
    const { x, y } = eventToNormalized(event);
    state.draggingIndex = findBoxAt(x, y);
  };

  const onMove = (event) => {
    if (state.draggingIndex < 0) return;
    // Block the page from scrolling while the user is dragging a text overlay.
    if (event.cancelable && event.touches) event.preventDefault();
    const { x, y } = eventToNormalized(event);
    const box = state.textBoxes[state.draggingIndex];
    box.x = Math.max(0, Math.min(1, x));
    box.y = Math.max(0, Math.min(1, y));
    renderPreview();
  };

  const onEnd = () => {
    state.draggingIndex = -1;
  };

  elements.canvas.addEventListener("mousedown", onStart);
  elements.canvas.addEventListener("touchstart", onStart, { passive: true });

  // touchmove must be non-passive so preventDefault() can stop page scrolling.
  window.addEventListener("mousemove", onMove);
  window.addEventListener("touchmove", onMove, { passive: false });

  window.addEventListener("mouseup", onEnd);
  window.addEventListener("touchend", onEnd);
  window.addEventListener("touchcancel", onEnd);
}

/**
 * Persist the current meme spec to sessionStorage and navigate to the
 * Result page, which is responsible for re-rendering and offering export.
 */
function generate() {
  if (!state.template) return;
  const spec = {
    templateUrl: state.template.url,
    templateName: state.template.name,
    textBoxes: state.textBoxes,
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

    state.image = await loadImage(state.template.url);
    state.textBoxes = defaultTextBoxes(state.template.box_count ?? 2);

    elements.status.hidden = true;
    elements.canvas.classList.add("is-loaded");
    renderInputs();
    renderPreview();
    bindDragHandlers();
    elements.generateBtn.disabled = false;
    elements.generateBtn.setAttribute("aria-disabled", "false");
    elements.generateBtn.addEventListener("click", generate);
  } catch (error) {
    console.error("Failed to load editor:", error);
    elements.frame.classList.add("is-error");
    elements.status.textContent = "Failed to load template. Please go back and try another.";
  }
}

init();
