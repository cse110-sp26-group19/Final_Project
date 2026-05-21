/**
 * Pipeline C — local face swap test runner.
 *
 * Swaps the face from `templates/stock image.jpg` onto the
 * Kurt Angle portrait meme (`templates/kurt template.jpeg`) using
 * the AILabTools AI Face Swap API.
 *
 * Usage:
 *   node --env-file=.env src/backend/pipelines/c/run-swap.js
 *
 * Output is saved to:
 *   src/backend/pipelines/c/images-generated/swapped_<timestamp>.png
 */

import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { runFaceSwap } from "./face-swap.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// The meme template — the face in this image gets REPLACED
const TARGET = resolve(__dirname, "templates/kurt template.jpeg");

// The user photo — this face gets INSERTED into the template
const FACE = resolve(__dirname, "templates/stock image.jpg");

// Output
const OUTPUT = resolve(__dirname, `images-generated/swapped_${Date.now()}.png`);

console.log("=== Pipeline C Face Swap ===");
console.log(`Target (scene): ${TARGET}`);
console.log(`Face (source):  ${FACE}`);
console.log(`Output:         ${OUTPUT}`);
console.log("");

runFaceSwap({ targetPath: TARGET, facePath: FACE, outputPath: OUTPUT })
  .then((out) => {
    console.log("");
    console.log(`Result saved: ${out}`);
  })
  .catch((err) => {
    console.error("Face swap failed:", err.message);
    process.exit(1);
  });
