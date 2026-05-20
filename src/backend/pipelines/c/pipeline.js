/**
 * Pipeline C mock implementation.
 *
 * This file represents the first testable backend flow for MemeBro.
 * It does not call Firebase or a real LLM yet.
 */

import { createRequire } from "module";

const require = createRequire(import.meta.url);

/** @type {Record<string, { context: string, text: null, user_image: null }>} */
const TEMPLATES = require("./templates.json");

/**
 * Resolve a meme template by ID from local template storage.
 *
 * This is the Firebase integration seam: when Firestore replaces local JSON,
 * only this function changes. Nothing else in the pipeline needs to be touched.
 *
 * @param {string} templateId - The template identifier (e.g. "IMG_1").
 * @returns {{ context: string, text: null, user_image: null }} The matched template.
 * @throws {TypeError} If templateId is not a non-empty string or is not found.
 */
export function resolveTemplate(templateId) {
  if (typeof templateId !== "string" || templateId.trim() === "") {
    throw new TypeError("resolveTemplate: templateId must be a non-empty string");
  }
  const template = TEMPLATES[templateId];
  if (!template) {
    throw new TypeError(`resolveTemplate: unknown template ID "${templateId}"`);
  }
  return template;
}

/**
 * Generate a mock meme response from a template ID and user image.
 *
 * @param {object} input - Generation input.
 * @param {string} input.templateId - The template identifier to resolve.
 * @param {string} input.userImage - Placeholder user image URL or identifier.
 * @returns {object} Mock generated meme response.
 */
export function generateMockMeme({ templateId, userImage }) {
  const template = resolveTemplate(templateId);
  return {
    image: null,
    text: "Doing the assignment last minute\nStarting it early",
    placement: {
      zone: "top-right",
      x: 0.65,
      y: 0.25,
    },
    metadata: {
      pipeline: "c",
      source: "mock",
      templateContext: template.context,
      userImage,
    },
  };
}
