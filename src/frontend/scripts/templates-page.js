/**
 * Template select page (Step 2 of 3) controller.
 *
 * Fetches the meme template list (cached via {@link getTemplates}), renders a
 * paginated grid of thumbnails, and wires up the search input, category chips,
 * Random button, and "see more" paginator. Selecting any template — either by
 * clicking its card or hitting Random — navigates to the Edit page with the
 * chosen template's id carried in the URL query string.
 */

import { getTemplates } from "../templates.js";
import { filterTemplates } from "../lib/template-filter.js";
import { setTemplate, updateStepIndicator, nextHref } from "../lib/flow-dom.js";

const TEMPLATES_PHRASES = [
  "Loading templates… ",
  "Fetching meme templates…",
  "Almost there…",
  "Getting the good stuff…",
];

const PAGE_SIZE = 12;

const elements = {
  grid: document.getElementById("template-grid"),
  loading: document.getElementById("grid-loading"),
  empty: document.getElementById("grid-empty"),
  search: document.getElementById("search-input"),
  chips: document.querySelectorAll(".templates-chip"),
  random: document.getElementById("random-btn"),
  seeMore: document.getElementById("see-more-btn"),
  next: document.getElementById("next-btn"),
};

const state = {
  templates: [],
  filtered: [],
  visible: PAGE_SIZE,
  category: "all",
  query: "",
  selectedId: null,
};

/**
 * Apply the current search query and category filter to the full template
 * list, reset pagination, and re-render the grid.
 */
function applyFilters() {
  state.filtered = filterTemplates(state.templates, {
    query: state.query,
    category: state.category,
  });
  state.visible = PAGE_SIZE;
  render();
}

/**
 * Render the visible slice of filtered templates into the grid, and toggle
 * the empty-state message and "see more" button accordingly.
 */
function render() {
  elements.grid.replaceChildren();
  elements.grid.setAttribute("aria-busy", "true");

  if (state.filtered.length === 0) {
    elements.empty.hidden = false;
    elements.seeMore.hidden = true;
    elements.grid.setAttribute("aria-busy", "false");
    return;
  }

  elements.empty.hidden = true;

  const slice = state.filtered.slice(0, state.visible);
  for (const template of slice) {
    elements.grid.appendChild(buildCard(template));
  }

  elements.seeMore.hidden = state.visible >= state.filtered.length;
  elements.grid.setAttribute("aria-busy", "false");
}

/**
 * Build a clickable template card element for the grid.
 *
 * @param {{id: string, name: string, url: string}} template
 * @returns {HTMLButtonElement}
 */
function buildCard(template) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "template-card";
  card.setAttribute("aria-label", `Select template: ${template.name}`);
  card.setAttribute("aria-pressed", "false");

  if (template.id === state.selectedId) {
    card.classList.add("template-card--selected");
    card.setAttribute("aria-pressed", "true");
  }

  const img = document.createElement("img");
  img.className = "template-card__image";
  img.src = template.url;
  img.alt = "";
  img.setAttribute("aria-hidden", "true");
  img.loading = "lazy";

  const name = document.createElement("span");
  name.className = "template-card__name";
  name.textContent = template.name;

  card.append(img, name);
  card.addEventListener("click", () => selectTemplate(template));
  return card;
}

/**
 * Select a template: remember it, highlight its card, and enable the Next
 * button. Flexible order — Next leads to upload if there's no photo yet, or
 * straight to edit if there is.
 *
 * @param {{id: string}} template
 */
function selectTemplate(template) {
  state.selectedId = template.id;
  setTemplate(template.id);
  render();
  enableNextButton();
}

/**
 * Point the Next button at the right destination and label it accordingly.
 */
function enableNextButton() {
  const dest = nextHref("templates"); // "upload.html" | "edit.html"
  elements.next.href = dest;
  elements.next.textContent = dest.startsWith("upload")
    ? "Next: add your photo →"
    : "Next: edit text →";
  elements.next.removeAttribute("aria-disabled");
  elements.next.removeAttribute("tabindex");
  elements.next.setAttribute("aria-label", elements.next.textContent.trim());
}

/**
 * Pick a uniformly random template from the current filtered list, remember it,
 * and head straight to the upload page so the user can add their photo.
 */
function pickRandom() {
  if (state.filtered.length === 0) return;
  const index = Math.floor(Math.random() * state.filtered.length);
  setTemplate(state.filtered[index].id);
  window.location.href = "upload.html";
}

/**
 * Wire up search, chip, random, and see-more event listeners.
 */
function bindEvents() {
  elements.search.addEventListener("input", (event) => {
    state.query = event.target.value;
    applyFilters();
  });

  elements.chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      elements.chips.forEach((c) => {
        c.classList.remove("templates-chip--active");
        c.setAttribute("aria-pressed", "false");
      });
      chip.classList.add("templates-chip--active");
      chip.setAttribute("aria-pressed", "true");
      state.category = chip.dataset.category;
      applyFilters();
    });
  });

  elements.random.addEventListener("click", pickRandom);

  elements.seeMore.addEventListener("click", () => {
    state.visible += PAGE_SIZE;
    render();
  });
}

/**
 * Page entry point — fetch templates, hide the loading message, and render.
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
  const phraseInterval = startPhrases("grid-loading-text", TEMPLATES_PHRASES);
  // Templates is always reachable; show the right step number for this visit.
  updateStepIndicator("templates");

  try {
    state.templates = await getTemplates();
    state.filtered = state.templates;
    clearInterval(phraseInterval);
    elements.loading.hidden = true;
    elements.grid.setAttribute("aria-busy", "false");
    bindEvents();
    render();
  } catch (error) {
    clearInterval(phraseInterval);
    console.error("Failed to load templates:", error);
    elements.loading.setAttribute("role", "alert");
    elements.loading.textContent = "Failed to load templates. Please refresh.";
  }
}

init();
