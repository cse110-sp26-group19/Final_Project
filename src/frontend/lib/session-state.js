/**
 * Browser adapter for the strict-order routing guard.
 *
 * Reads the real progress signals — a face photo and meme spec in
 * sessionStorage, a selected template in sessionStorage or the URL — maps them
 * to the page-name redirects from `routing-guard.js`, and performs the
 * redirect. Page controllers call `enforceGuard(page)` at the top of their init
 * so a page never renders without its prerequisites. See ADR 0007.
 */
import { guardRedirect } from "./routing-guard.js";

/** sessionStorage key for the uploaded face photo (data URL). Set by upload.js. */
export const FACE_KEY = "memebro:face-photo";
/** sessionStorage key for the chosen template id. Set when a template is picked. */
export const TEMPLATE_KEY = "memebro:selected-template";
/** sessionStorage key for the generated meme spec. Set by the Edit page. */
export const MEME_KEY = "memebro:current-meme";

/**
 * Snapshot the user's progress through the funnel from sessionStorage and the
 * current URL. A template counts if it is stored OR carried in `?templateId`;
 * a meme counts if stored OR carried in `?spec` (so shared links still open the
 * result page for visitors who never ran the funnel).
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
 * Enforce strict ordering for the given page. If a prerequisite is missing,
 * redirect to the earliest unfinished step and return `true` so the caller can
 * stop initializing. `location.replace` is used so guarded bounces don't pile
 * up in history and trap the back button.
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
