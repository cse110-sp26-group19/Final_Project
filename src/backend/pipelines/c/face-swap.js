/**
 * Pipeline C — AILabTools Face Swap API wrapper.
 *
 * Handles the full async face swap flow:
 *   1. Submit a job (POST) → get back a task_id
 *   2. Poll until complete (GET) → get back an image URL
 *   3. Download the result image to disk
 *
 * Requires AILAB_API_KEY in your environment (.env file).
 *
 * image_target  = the meme template  (the face that gets REPLACED)
 * image_template = the user photo    (the face that gets INSERTED)
 */

import { readFileSync, mkdirSync, writeFileSync } from "fs";
import { dirname, basename } from "path";

const SUBMIT_URL = "https://www.ailabapi.com/api/portrait/editing/ai-face-swap";
const POLL_URL = "https://www.ailabapi.com/api/common/query-async-task-result";

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 20;

/**
 * Get the MIME type for a file path based on extension.
 *
 * @param {string} filePath
 * @returns {string}
 */
function getMimeType(filePath) {
  const ext = filePath.split(".").pop().toLowerCase();
  const types = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" };
  return types[ext] ?? "image/jpeg";
}

/**
 * Submit a face swap job to AILabTools.
 *
 * @param {string} targetPath   - Meme template image path (face to be REPLACED).
 * @param {string} facePath     - User photo path (face to INSERT).
 * @returns {Promise<string>}   The task_id returned by the API.
 */
export async function submitFaceSwap(targetPath, facePath) {
  const apiKey = process.env.AILAB_API_KEY;
  if (!apiKey) {
    throw new Error("AILAB_API_KEY is not set. Add it to your .env file.");
  }

  const form = new FormData();

  const targetBuffer = readFileSync(targetPath);
  form.append(
    "image_target",
    new Blob([targetBuffer], { type: getMimeType(targetPath) }),
    basename(targetPath)
  );

  const faceBuffer = readFileSync(facePath);
  form.append(
    "image_template",
    new Blob([faceBuffer], { type: getMimeType(facePath) }),
    basename(facePath)
  );

  const res = await fetch(SUBMIT_URL, {
    method: "POST",
    headers: { "ailabapi-api-key": apiKey },
    body: form,
  });

  const data = await res.json();

  if (data.error_code !== 0) {
    throw new Error(`Face swap submit failed (${data.error_code}): ${data.error_msg}`);
  }

  return data.task_id;
}

/**
 * Poll the async task result endpoint until the job is complete.
 *
 * @param {string} taskId     - The task_id returned by submitFaceSwap.
 * @returns {Promise<string>} The result image URL.
 */
export async function pollFaceSwap(taskId) {
  const apiKey = process.env.AILAB_API_KEY;

  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const res = await fetch(`${POLL_URL}?task_id=${encodeURIComponent(taskId)}`, {
      headers: { "ailabapi-api-key": apiKey },
    });

    const data = await res.json();

    if (data.error_code !== 0) {
      throw new Error(`Polling failed (${data.error_code}): ${data.error_msg}`);
    }

    // task_status: 0 = queued, 1 = processing, 2 = complete
    if (data.task_status === 2) {
      return data.data.image;
    }

    const statusLabel = ["queued", "processing", "complete"][data.task_status] ?? "unknown";
    console.log(`  [${i + 1}/${MAX_POLLS}] status: ${statusLabel}...`);
  }

  throw new Error(`Face swap timed out after ${MAX_POLLS} polling attempts.`);
}

/**
 * Download an image from a URL and write it to outputPath.
 *
 * @param {string} imageUrl
 * @param {string} outputPath
 */
export async function downloadImage(imageUrl, outputPath) {
  const res = await fetch(imageUrl);
  const buffer = Buffer.from(await res.arrayBuffer());
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, buffer);
}

/**
 * Full end-to-end face swap: submit → poll → download.
 *
 * @param {object} options
 * @param {string} options.targetPath  - Meme template path (face to REPLACE).
 * @param {string} options.facePath    - User photo path (face to INSERT).
 * @param {string} options.outputPath  - Where to save the result image.
 * @returns {Promise<string>}          The output path where the result was saved.
 */
export async function runFaceSwap({ targetPath, facePath, outputPath }) {
  console.log("Submitting face swap job...");
  const taskId = await submitFaceSwap(targetPath, facePath);
  console.log(`  task_id: ${taskId}`);

  console.log("Polling for result...");
  const imageUrl = await pollFaceSwap(taskId);
  console.log(`  result: ${imageUrl}`);

  console.log(`Saving to ${outputPath}...`);
  await downloadImage(imageUrl, outputPath);
  console.log("Done.");

  return outputPath;
}
