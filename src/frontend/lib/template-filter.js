/**
 * Pure template-filtering logic for the Template Select page.
 *
 * Kept separate from `templates-page.js` so it can be unit-tested in Node
 * without a browser environment. The controller calls this function whenever
 * the user types in the search input or toggles a category chip.
 */

/**
 * Filter a list of meme templates by search query and category.
 *
 * The match is AND-style across both criteria: a template must satisfy the
 * (possibly empty) query AND the category to remain in the result. Search is
 * a case-insensitive substring match on the template's `name`. Category
 * filtering currently supports two values:
 *
 * - `"all"` (or any unrecognized value) — no category filter applied
 * - `"popular"` — keep only templates with `box_count >= 4`
 *
 * @param {Array<{name: string, box_count: number}>} templates - The full template list.
 * @param {Object} [criteria]
 * @param {string} [criteria.query=""] - User's search input. Trimmed and lowercased internally.
 * @param {string} [criteria.category="all"] - Active category chip.
 * @returns {Array} The subset of `templates` that match both criteria.
 */
export function filterTemplates(templates, { query = "", category = "all" } = {}) {
  const trimmedQuery = query.trim().toLowerCase();

  return templates.filter((template) => {
    if (trimmedQuery && !template.name.toLowerCase().includes(trimmedQuery)) {
      return false;
    }
    if (category === "popular" && template.box_count < 4) {
      return false;
    }
    return true;
  });
}
