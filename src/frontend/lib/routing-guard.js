/**
 * Pure page-routing logic for the flexible meme creation flow.
 *
 * Creating a meme needs two inputs — a face photo and a chosen template —
 * which the user may provide in **either order**, plus an edit step that needs
 * both, plus a result step that needs a generated meme. This module decides,
 * from a progress snapshot, whether a page may render or must redirect, and
 * where the user should go next to keep moving forward.
 *
 * Kept free of `window`/`sessionStorage` so it can be unit-tested in Node. The
 * browser adapter in `session-state.js` reads real state and applies redirects
 * and the step indicator. See ADR 0007 for why flexible ordering was chosen.
 */

/** Ordered funnel steps (used for reference/labels). Each is a page name. */
export const FLOW = ["upload", "templates", "edit", "result"];

/**
 * The next page the user should visit to keep moving forward. Template and
 * photo are interchangeable inputs; once both exist the next step is edit,
 * then result.
 *
 * @param {{hasPhoto: boolean, hasTemplate: boolean, hasMeme: boolean}} progress
 * @returns {"upload" | "templates" | "edit" | "result"}
 */
export function nextIncompleteStep({ hasPhoto, hasTemplate, hasMeme }) {
  if (!hasTemplate) return "templates";
  if (!hasPhoto) return "upload";
  if (!hasMeme) return "edit";
  return "result";
}

/**
 * Decide where a page must send the user under flexible ordering.
 *
 * `upload` and `templates` are always reachable (either can come first, which
 * is also what the navbar needs). `edit` requires both inputs and redirects to
 * whichever is missing; `result` requires a generated meme and otherwise
 * bounces to the next incomplete step. The result never equals `page`, so
 * callers cannot create a redirect loop.
 *
 * @param {"upload" | "templates" | "edit" | "result"} page - Page being loaded.
 * @param {{hasPhoto: boolean, hasTemplate: boolean, hasMeme: boolean}} progress
 * @returns {string | null} Page name to redirect to, or `null` if the page may render.
 */
export function guardRedirect(page, progress) {
  const { hasPhoto, hasTemplate, hasMeme } = progress;
  switch (page) {
    case "upload":
      return null; // input step — always reachable
    case "templates":
      return null; // input step — always reachable
    case "edit":
      if (!hasTemplate) return "templates";
      if (!hasPhoto) return "upload";
      return null;
    case "result":
      return hasMeme ? null : nextIncompleteStep(progress);
    default:
      return null; // unknown page — not part of the funnel, don't guard
  }
}

/**
 * Dynamic step-indicator text for a page, reflecting actual progress. Because
 * the two inputs can be done in any order, whichever the user does first reads
 * "Step 1 of 3" and the second reads "Step 2 of 3"; edit is always the final
 * step.
 *
 * @param {"upload" | "templates" | "edit" | "result"} page
 * @param {{hasPhoto: boolean, hasTemplate: boolean, hasMeme: boolean}} progress
 * @returns {string} The meta line to show, or `""` for pages without one.
 */
export function stepMeta(page, progress) {
  switch (page) {
    case "upload":
      return `Step ${progress.hasTemplate ? 2 : 1} of 3 · Upload`;
    case "templates":
      return `Step ${progress.hasPhoto ? 2 : 1} of 3 · Meme Selection`;
    case "edit":
      return "Step 3 of 3 · Edit";
    default:
      return "";
  }
}
