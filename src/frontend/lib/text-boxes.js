/**
 * Build default normalized positions for a template with N text boxes:
 * first near the top, last near the bottom, intermediate boxes spaced
 * evenly in between.
 *
 * @param {number} count
 * @returns {Array<{text: string, x: number, y: number}>}
 */
export function defaultTextBoxes(count) {
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
export function labelForBox(index, total) {
  if (index === 0) return "Top text";
  if (index === total - 1) return "Bottom text";
  return `Text ${index + 1}`;
}
