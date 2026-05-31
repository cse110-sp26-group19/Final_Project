/**
 * Face detection utility using face-api.js
 * Detects faces in images and provides cropping utilities
 */

import * as faceapi from "face-api.js";

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";

let modelsLoaded = false;

/**
 * Load face-api models from CDN
 */
export async function loadModels() {
  if (modelsLoaded) return;

  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
    console.log("Face-api models loaded");
  } catch (error) {
    console.error("Failed to load face-api models:", error);
    throw new Error("Face detection models failed to load. Check your internet connection.");
  }
}

/**
 * Detect all faces in an image
 * @param {HTMLImageElement | HTMLCanvasElement} input - Image element or canvas
 * @returns {Promise<Array>} Array of detected faces with bounding boxes
 */
export async function detectFaces(input) {
  if (!modelsLoaded) {
    await loadModels();
  }

  try {
    const detections = await faceapi
      .detectAllFaces(input, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    return detections.map((detection) => ({
      box: {
        x: Math.floor(detection.detection.box.x),
        y: Math.floor(detection.detection.box.y),
        width: Math.floor(detection.detection.box.width),
        height: Math.floor(detection.detection.box.height),
      },
      score: detection.detection.score,
    }));
  } catch (error) {
    console.error("Face detection failed:", error);
    return [];
  }
}

/**
 * Crop a face region from a canvas and return as Blob
 * Adds padding around the detected face for better results
 * @param {HTMLCanvasElement} canvas - Source canvas
 * @param {Object} boundingBox - Face bounding box {x, y, width, height}
 * @param {number} padding - Extra padding around face (default 20px)
 * @returns {Promise<Blob>} Cropped face image as Blob
 */
export async function cropFaceRegion(canvas, boundingBox, padding = 20) {
  const { x, y, width, height } = boundingBox;

  // Add padding and clamp to canvas bounds
  const startX = Math.max(0, x - padding);
  const startY = Math.max(0, y - padding);
  const endX = Math.min(canvas.width, x + width + padding);
  const endY = Math.min(canvas.height, y + height + padding);

  const cropWidth = endX - startX;
  const cropHeight = endY - startY;

  // Create temporary canvas for cropped image
  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = cropWidth;
  cropCanvas.height = cropHeight;

  const ctx = cropCanvas.getContext("2d");
  ctx.drawImage(canvas, startX, startY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

  return new Promise((resolve, reject) => {
    cropCanvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Failed to crop face region"));
      }
    }, "image/png");
  });
}

/**
 * Create a canvas from an image file for processing
 * @param {File} file - Image file
 * @returns {Promise<HTMLCanvasElement>} Canvas with loaded image
 */
export async function fileToCanvas(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = event.target.result;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
