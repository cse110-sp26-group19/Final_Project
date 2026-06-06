/**
 * Browser adapter for the flexible routing logic.
 *
 * Reads the real progress signals — a face photo and meme spec in
 * sessionStorage, a selected template in sessionStorage or the URL — and
 * applies the decisions from `routing-guard.js`: guarding pages, sending the
 * user to the next incomplete step, and updating the step indicator. Page
 * controllers call `enforceGuard(page)` and `renderStepIndicator(page)` on
 * load. See ADR 0007.
 */
import { guardRedirect, nextIncompleteStep, stepMeta } from "./routing-guard.js";

/** sessionStorage key for the uploaded face photo (data URL). Set by upload.js. */
export const FACE_KEY = "memebro:face-photo";
/** sessionStorage key for the chosen template id. Set when a template is picked. */
export const TEMPLATE_KEY = "memebro:selected-template";
/** sessionStorage key for the generated meme spec. Set by the Edit page. */
export const MEME_KEY = "memebro:current-meme";

/**
 * Snapshot the user's progress from sessionStorage and the current URL. A
 * template counts if it is stored OR carried in `?templateId`; a meme counts
 * if stored OR carried in `?spec` (so shared result links still open).
 *
 * @returns {{hasPhoto: boolean, hasTemplate: boolean, hasMeme: boolean}}
 */
export function readProgress() {
  const params = new URLSearchParams(window.location.search);
  return {
    hasPhoto: Boolean(sessionStorage.getItem(FACE_KEY)),
    hasTemplate: Boolean(sessionStorage.getItem(TEMPLATE_KEY)) || params.has("templateId"),
    hasMeme: Boolean(sessionStorage.getItem(MEME_KEY)) || params.has("spec"),
  };
}

/**
 * Enforce the flow for the given page. If a prerequisite is missing, redirect
 * to the appropriate step and return `true` so the caller can stop
 * initializing. `location.replace` keeps guarded bounces out of history.
 *
 * @param {"upload" | "templates" | "edit" | "result"} page
 * @returns {boolean} Whether a redirect was triggered.
 */
export function enforceGuard(page) {
  const target = guardRedirect(page, readProgress());
  if (target) {
    window.location.replace(`${target}.html`);
    return true;
  }
  return false;
}

/**
 * Record the chosen template id so later pages (and their guards) can see it.
 *
 * @param {string} templateId
 */
export function setSelectedTemplate(templateId) {
  sessionStorage.setItem(TEMPLATE_KEY, templateId);
}

/**
 * The currently selected template id, or `null` if none has been chosen.
 *
 * @returns {string | null}
 */
export function getSelectedTemplate() {
  return sessionStorage.getItem(TEMPLATE_KEY);
}

/**
 * Navigate to the next step that still needs completing, given current
 * progress. Used after picking a template or finishing an upload so the user
 * flows forward regardless of which input they did first.
 */
export function goToNextStep() {
  window.location.href = `${nextIncompleteStep(readProgress())}.html`;
}

/**
 * Update the page's step-indicator meta line to reflect actual progress. No-op
 * on pages that have no `.step-indicator__meta` element.
 *
 * @param {"upload" | "templates" | "edit" | "result"} page
 */
export function renderStepIndicator(page) {
  const meta = document.querySelector(".step-indicator__meta");
  if (meta) meta.textContent = stepMeta(page, readProgress());
}
