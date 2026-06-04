/**
 * Template select page (Step 2 of 3) controller.
 *
 * Fetches the meme template list (cached via {@link getTemplates}), renders a
 * paginated grid of thumbnails, and wires up the search input, category chips,
 * Random button, and "see more" paginator. Selecting any template — either by
 * clicking its card or hitting Random — navigates to the Edit page with the
 * chosen template's id carried in the URL query string.
 */

import { getTemplates } from "../../templates.js";
import { filterTemplates } from "../lib/template-filter.js";

const PAGE_SIZE = 12;

const elements = {
  grid: document.getElementById("template-grid"),
  loading: document.getElementById("grid-loading"),
  empty: document.getElementById("grid-empty"),
  search: document.getElementById("search-input"),
  chips: document.querySelectorAll(".templates-chip"),
  random: document.getElementById("random-btn"),
  seeMore: document.getElementById("see-more-btn"),
};

const state = {
  templates: [],
  filtered: [],
  visible: PAGE_SIZE,
  category: "all",
  query: "",
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

  if (state.filtered.length === 0) {
    elements.empty.hidden = false;
    elements.seeMore.hidden = true;
    return;
  }

  elements.empty.hidden = true;

  const slice = state.filtered.slice(0, state.visible);
  for (const template of slice) {
    elements.grid.appendChild(buildCard(template));
  }

  elements.seeMore.hidden = state.visible >= state.filtered.length;
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

  const img = document.createElement("img");
  img.className = "template-card__image";
  img.src = template.url;
  img.alt = template.name;
  img.loading = "lazy";

  const name = document.createElement("span");
  name.className = "template-card__name";
  name.textContent = template.name;

  card.append(img, name);
  card.addEventListener("click", () => selectTemplate(template));
  return card;
}

/**
 * Navigate to the Edit page, carrying the selected template id in the URL.
 *
 * @param {{id: string}} template
 */
function selectTemplate(template) {
  window.location.href = `edit.html?templateId=${encodeURIComponent(template.id)}`;
}

/**
 * Pick a uniformly random template from the current filtered list and navigate
 * to the Edit page with it.
 */
function pickRandom() {
  if (state.filtered.length === 0) return;
  const index = Math.floor(Math.random() * state.filtered.length);
  selectTemplate(state.filtered[index]);
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
      elements.chips.forEach((c) => c.classList.remove("templates-chip--active"));
      chip.classList.add("templates-chip--active");
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
async function init() {
  try {
    state.templates = await getTemplates();
    state.filtered = state.templates;
    elements.loading.hidden = true;
    bindEvents();
    render();
  } catch (error) {
    console.error("Failed to load templates:", error);
    elements.loading.textContent = "Failed to load templates. Please refresh.";
  }
}

init();
