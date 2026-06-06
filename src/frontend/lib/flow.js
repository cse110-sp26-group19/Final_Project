/**
 * Pure rules for the meme-making flow.
 *
 * The flow has two interchangeable inputs — a face **photo** and a chosen
 * **template** — followed by **edit** and then the share/result screen. The
 * user may start with either input (from the home page or the navbar) and is
 * routed to the other input before reaching edit. These functions take a
 * progress snapshot and return the step number/label, the "continue"
 * destination for each page, and an access-guard redirect. No `window` or
 * `sessionStorage`, so they unit-test in Node. See ADR 0007.
 */

/** Page ids, in nominal funnel order. Each matches a `<page>.html` file. */
export const PAGES = ["upload", "templates", "edit", "result"];

/** There are three numbered creation steps; result is the share/output screen. */
export const TOTAL_STEPS = 3;

const STEP_LABELS = {
  upload: "Upload",
  templates: "Meme Selection",
  edit: "Edit",
};

/**
 * The step number to show on a page, given progress. The two inputs are
 * interchangeable, so whichever the user does first is step 1 and the second
 * is step 2; edit is always step 3. Returns `null` for pages without a step
 * indicator (e.g. result).
 *
 * @param {"upload" | "templates" | "edit" | "result"} page
 * @param {{hasPhoto: boolean, hasTemplate: boolean}} progress
 * @returns {number | null}
 */
export function stepNumber(page, { hasPhoto, hasTemplate }) {
  switch (page) {
    case "upload":
      return hasTemplate ? 2 : 1; // if the template is already chosen, this is the 2nd input
    case "templates":
      return hasPhoto ? 2 : 1; // if the photo is already uploaded, this is the 2nd input
    case "edit":
      return 3;
    default:
      return null;
  }
}

/**
 * The full step-indicator meta line for a page, or `""` if it has none.
 *
 * @param {"upload" | "templates" | "edit" | "result"} page
 * @param {{hasPhoto: boolean, hasTemplate: boolean}} progress
 * @returns {string}
 */
export function stepMeta(page, progress) {
  const n = stepNumber(page, progress);
  if (n === null) return "";
  return `Step ${n} of ${TOTAL_STEPS} · ${STEP_LABELS[page]}`;
}

/**
 * Where the "continue / Next" action on `page` should lead. After the photo,
 * the user goes to pick a template (or straight to edit if already chosen);
 * after the template, to upload (or edit); edit continues to result.
 *
 * @param {"upload" | "templates" | "edit" | "result"} page
 * @param {{hasPhoto: boolean, hasTemplate: boolean}} progress
 * @returns {"upload" | "templates" | "edit" | "result"}
 */
export function nextStep(page, { hasPhoto, hasTemplate }) {
  switch (page) {
    case "upload":
      return hasTemplate ? "edit" : "templates";
    case "templates":
      return hasPhoto ? "edit" : "upload";
    case "edit":
      return "result";
    default:
      return "result";
  }
}

/**
 * Where to redirect if `page` is opened without its prerequisites, or `null`
 * if it may render. The two inputs are always reachable in any order; edit
 * needs both (redirecting to whichever is missing); result needs a generated
 * meme (otherwise it sends the user to start the flow).
 *
 * The result never equals `page`, so callers cannot create a redirect loop.
 *
 * @param {"upload" | "templates" | "edit" | "result"} page
 * @param {{hasPhoto: boolean, hasTemplate: boolean, hasMeme: boolean}} progress
 * @returns {string | null}
 */
export function guardTarget(page, { hasPhoto, hasTemplate, hasMeme }) {
  switch (page) {
    case "upload":
    case "templates":
      return null; // inputs are always reachable, in any order
    case "edit":
      if (!hasTemplate) return "templates";
      if (!hasPhoto) return "upload";
      return null;
    case "result":
      if (hasMeme) return null;
      if (!hasTemplate) return "templates";
      if (!hasPhoto) return "upload";
      return "edit";
    default:
      return null;
  }
}
