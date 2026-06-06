/**
 * Browser glue for the meme-making flow.
 *
 * Reads progress from `sessionStorage` and the URL, applies the pure rules in
 * `flow.js`, and performs the side effects: guarding a page on load, updating
 * its step indicator, computing the Next button's destination, and resetting
 * the flow when the user returns home. State is intentionally session-scoped
 * and reset on the home page, so each visit is a fresh process. See ADR 0007.
 */
import { stepMeta, nextStep, guardTarget } from "./flow.js";

/** sessionStorage keys for the three pieces of flow state. */
export const KEYS = {
  photo: "memebro:face-photo",
  template: "memebro:selected-template",
  meme: "memebro:current-meme",
};

/**
 * Snapshot progress from sessionStorage and the URL. A template also counts if
 * carried in `?templateId`, and a meme if carried in `?spec`, so deep/shared
 * links still resolve.
 *
 * @returns {{hasPhoto: boolean, hasTemplate: boolean, hasMeme: boolean}}
 */
export function readProgress() {
  const params = new URLSearchParams(window.location.search);
  return {
    hasPhoto: Boolean(sessionStorage.getItem(KEYS.photo)),
    hasTemplate: Boolean(sessionStorage.getItem(KEYS.template)) || params.has("templateId"),
    hasMeme: Boolean(sessionStorage.getItem(KEYS.meme)) || params.has("spec"),
  };
}

/** Clear all flow state — called on the home page so each visit starts fresh. */
export function resetFlow() {
  Object.values(KEYS).forEach((key) => sessionStorage.removeItem(key));
}

/** Persist the chosen template id. */
export function setTemplate(id) {
  sessionStorage.setItem(KEYS.template, id);
}

/** The chosen template id, or `null`. */
export function getTemplate() {
  return sessionStorage.getItem(KEYS.template);
}

/**
 * Guard a page on load. If a prerequisite is missing, redirect (via
 * `location.replace`, so guarded bounces stay out of history) and return
 * `true` so the caller stops initializing.
 *
 * @param {"upload" | "templates" | "edit" | "result"} page
 * @returns {boolean} whether a redirect was triggered
 */
export function guardPage(page) {
  const target = guardTarget(page, readProgress());
  if (target) {
    window.location.replace(`${target}.html`);
    return true;
  }
  return false;
}

/**
 * Update the page's `.step-indicator__meta` line to reflect actual progress.
 * No-op if the page has no step indicator.
 *
 * @param {"upload" | "templates" | "edit" | "result"} page
 */
export function updateStepIndicator(page) {
  const meta = document.querySelector(".step-indicator__meta");
  if (meta) meta.textContent = stepMeta(page, readProgress());
}

/**
 * The href the Next/continue control on `page` should point at, given current
 * progress (e.g. `"upload.html"`).
 *
 * @param {"upload" | "templates" | "edit" | "result"} page
 * @returns {string}
 */
export function nextHref(page) {
  return `${nextStep(page, readProgress())}.html`;
}
