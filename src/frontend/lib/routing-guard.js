/**
 * Pure page-routing guard logic for the strict-order meme creation flow.
 *
 * The app is a four-step funnel: upload → templates → edit → result. Each page
 * assumes the prior steps happened (a face photo in sessionStorage, a selected
 * template, a generated meme). This module decides, from a snapshot of how far
 * the user has progressed, whether a given page may render or must redirect to
 * the earliest unfinished step.
 *
 * Kept free of `window`/`sessionStorage` so it can be unit-tested in Node. The
 * browser adapter in `session-state.js` reads real state and applies the
 * redirect. See ADR 0007 for why strict ordering was chosen.
 */

/** Ordered funnel steps. Each value is a page name (without the `.html`). */
export const FLOW = ["upload", "templates", "edit", "result"];

/**
 * The earliest step the user has not yet satisfied, given their progress.
 * Returns `"result"` only when every prerequisite is met.
 *
 * @param {{hasPhoto: boolean, hasTemplate: boolean, hasMeme: boolean}} progress
 * @returns {"upload" | "templates" | "edit" | "result"}
 */
export function firstUnfinishedStep({ hasPhoto, hasTemplate, hasMeme }) {
  if (!hasPhoto) return "upload";
  if (!hasTemplate) return "templates";
  if (!hasMeme) return "edit";
  return "result";
}

/**
 * Decide where a page must send the user under strict ordering.
 *
 * Each page is reachable only once its prerequisites are met; otherwise the
 * user is bounced to the earliest unfinished step. The result never equals
 * `page`, so callers cannot create a redirect loop.
 *
 * @param {"upload" | "templates" | "edit" | "result"} page - Page being loaded.
 * @param {{hasPhoto: boolean, hasTemplate: boolean, hasMeme: boolean}} progress
 * @returns {string | null} Page name to redirect to, or `null` if the page may render.
 */
export function guardRedirect(page, progress) {
  const { hasPhoto, hasTemplate, hasMeme } = progress;
  switch (page) {
    case "upload":
      return null; // entry point — always reachable
    case "templates":
      return hasPhoto ? null : "upload";
    case "edit":
      if (!hasPhoto) return "upload";
      if (!hasTemplate) return "templates";
      return null;
    case "result":
      return hasMeme ? null : firstUnfinishedStep(progress);
    default:
      return null; // unknown page — not part of the funnel, don't guard
  }
}
