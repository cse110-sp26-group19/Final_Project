/**
 * Pipeline C implementation.
 *
 * Exports two generation paths:
 *   - generateMockMeme  — no network calls, safe for unit tests
 *   - generateMeme      — calls AILabTools Face Swap API (requires AILAB_API_KEY)
 */

import { createRequire } from "module";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { runFaceSwap } from "./face-swap.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const require = createRequire(import.meta.url);

/** @type {Record<string, { context: string, imageZone?: { x: number, y: number, w: number, h: number }, text: null, user_image: null }>} */
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
 * @returns {object} Mock generated meme response including imageZone when
 *   the template defines one. The frontend uses imageZone to composite the
 *   user's cropped face onto the meme canvas at the correct position.
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
    imageZone: template.imageZone ?? null,
    metadata: {
      pipeline: "c",
      source: "mock",
      templateContext: template.context,
      userImage,
    },
  };
}

/**
 * Generate a real meme by swapping the user's face into a template using
 * the AILabTools AI Face Swap API.
 *
 * Only works for templates where faceSwapSupported is true and an image
 * filename is defined. Requires AILAB_API_KEY in the environment.
 *
 * @param {object} input
 * @param {string} input.templateId   - The template identifier (e.g. "KURT").
 * @param {string} input.userImagePath - Absolute path to the user's photo.
 * @param {string} input.outputPath   - Absolute path to save the result image.
 * @returns {Promise<object>}         Generation result with image path and metadata.
 */
export async function generateMeme({ templateId, userImagePath, outputPath }) {
  const template = resolveTemplate(templateId);

  if (!template.faceSwapSupported) {
    throw new Error(
      `generateMeme: template "${templateId}" does not support face swap. ` +
        `Use generateMockMeme or choose a template with faceSwapSupported: true.`
    );
  }

  if (!template.image) {
    throw new Error(`generateMeme: template "${templateId}" has no image filename defined.`);
  }

  const templateImagePath = resolve(__dirname, "templates", template.image);

  const savedPath = await runFaceSwap({
    targetPath: templateImagePath,
    facePath: userImagePath,
    outputPath,
  });

  return {
    image: savedPath,
    text: null,
    placement: null,
    imageZone: template.imageZone ?? null,
    metadata: {
      pipeline: "c",
      source: "ailab-face-swap",
      templateContext: template.context,
      userImagePath,
    },
  };
}
