/**
 * Face swap service - orchestrates multi-face detection and swapping
 * Coordinates between face detection, API calls, and image composition
 */

import { detectFaces, cropFaceRegion, fileToCanvas, loadModels } from "./face-detection.js";
import { compositeSwappedFaces, canvasToBlob, downloadCanvas } from "./face-composition.js";

const API_BASE = "http://localhost:3001";

/**
 * Perform a single face swap via API
 * @param {File} sourceImage - Source face image
 * @param {Blob} targetImageBlob - Target region image blob
 * @returns {Promise<Blob>} Swapped face region as blob
 */
async function swapFaceRegion(sourceImage, targetImageBlob) {
  const formData = new FormData();
  formData.append("sourceImage", sourceImage);
  formData.append("targetImage", new File([targetImageBlob], "target.png", { type: "image/png" }));

  const response = await fetch(`${API_BASE}/api/swap`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Face swap API error: ${response.status}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || "Face swap failed");
  }

  // Download the result image and return as blob
  const imageResponse = await fetch(data.result.outputPath);
  return await imageResponse.blob();
}

/**
 * Perform multi-face swap with progress callback
 * @param {File} sourceImage - Source face image file
 * @param {File} targetImage - Target image file
 * @param {Function} onProgress - Callback with progress updates
 * @returns {Promise<HTMLCanvasElement>} Final composite canvas
 */
export async function multiSwap(sourceImage, targetImage, onProgress = () => {}) {
  try {
    // Initialize face detection
    onProgress({ status: "loading", message: "Loading face detection models..." });
    await loadModels();

    // Convert images to canvas
    onProgress({ status: "processing", message: "Processing images..." });
    const targetCanvas = await fileToCanvas(targetImage);

    // Detect faces
    onProgress({ status: "detecting", message: "Detecting faces..." });
    const faces = await detectFaces(targetCanvas);

    if (faces.length === 0) {
      throw new Error("No faces detected in target image");
    }

    onProgress({
      status: "detected",
      message: `Found ${faces.length} face(s)`,
      count: faces.length,
    });

    // Swap each face
    const swappedFaces = [];

    for (let i = 0; i < faces.length; i++) {
      onProgress({
        status: "swapping",
        message: `Swapping face ${i + 1}/${faces.length}...`,
        progress: i,
        total: faces.length,
      });

      const face = faces[i];

      // Crop face region with padding
      const faceCrop = await cropFaceRegion(targetCanvas, face.box, 20);

      // Swap via API
      const swapped = await swapFaceRegion(sourceImage, faceCrop);

      swappedFaces.push({
        box: face.box,
        swappedBlob: swapped,
      });
    }

    // Composite all swapped faces onto original
    onProgress({
      status: "compositing",
      message: "Compositing results...",
    });

    const resultCanvas = await compositeSwappedFaces(targetCanvas, swappedFaces);

    onProgress({
      status: "complete",
      message: "Face swap complete!",
      result: resultCanvas,
    });

    return resultCanvas;
  } catch (error) {
    onProgress({
      status: "error",
      message: error.message,
      error,
    });
    throw error;
  }
}

/**
 * Perform single-face swap (backward compatible)
 * @param {File} sourceImage - Source face image
 * @param {File} targetImage - Target image
 * @returns {Promise<Blob>} Swapped image as blob
 */
export async function singleSwap(sourceImage, targetImage) {
  const formData = new FormData();
  formData.append("sourceImage", sourceImage);
  formData.append("targetImage", targetImage);

  const response = await fetch(`${API_BASE}/api/swap`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Face swap API error: ${response.status}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || "Face swap failed");
  }

  // Download and return the image
  const imageResponse = await fetch(data.result.outputPath);
  return await imageResponse.blob();
}

/**
 * Check if API server is available
 * @returns {Promise<boolean>} True if API is reachable
 */
export async function checkAPI() {
  try {
    const response = await fetch(`${API_BASE}/health`, { method: "GET" });
    return response.ok;
  } catch {
    return false;
  }
}
