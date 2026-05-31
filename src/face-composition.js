/**
 * Face composition utility
 * Composites multiple swapped faces back onto the original image
 */

/**
 * Load an image from a file or URL
 * @param {File | string} source - Image file or URL
 * @returns {Promise<HTMLImageElement>} Loaded image
 */
async function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    if (source instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(source);
    } else {
      img.src = source;
    }

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
  });
}

/**
 * Convert a Blob to HTMLImageElement
 * @param {Blob} blob - Image blob
 * @returns {Promise<HTMLImageElement>} Image element
 */
export async function blobToImage(blob) {
  const url = URL.createObjectURL(blob);
  try {
    return await loadImage(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Composite multiple swapped face regions back onto the original image
 * @param {HTMLCanvasElement} originalCanvas - Original image canvas
 * @param {Array} faceRegions - Array of {box, swappedBlob} for each face
 * @returns {Promise<HTMLCanvasElement>} Composite result canvas
 */
export async function compositeSwappedFaces(originalCanvas, faceRegions) {
  // Create result canvas
  const resultCanvas = document.createElement("canvas");
  resultCanvas.width = originalCanvas.width;
  resultCanvas.height = originalCanvas.height;

  const ctx = resultCanvas.getContext("2d", { willReadFrequently: true });

  // Draw original image as base
  ctx.drawImage(originalCanvas, 0, 0);

  // Composite each swapped face
  for (const region of faceRegions) {
    const { box, swappedBlob } = region;
    const padding = 20;

    const startX = Math.max(0, box.x - padding);
    const startY = Math.max(0, box.y - padding);
    const endX = Math.min(originalCanvas.width, box.x + box.width + padding);
    const endY = Math.min(originalCanvas.height, box.y + box.height + padding);

    const cropWidth = endX - startX;
    const cropHeight = endY - startY;

    // Load swapped face image
    const swappedImg = await blobToImage(swappedBlob);

    // Draw swapped face onto result canvas
    ctx.drawImage(swappedImg, startX, startY, cropWidth, cropHeight);

    // Blend edges slightly to reduce visible seams (optional)
    blendEdges(ctx, startX, startY, cropWidth, cropHeight, originalCanvas, 5);
  }

  return resultCanvas;
}

/**
 * Blend edges of a composited region to reduce visible seams
 * @private
 */
function blendEdges(ctx, x, y, width, height, originalCanvas, blendWidth) {
  const originalCtx = originalCanvas.getContext("2d", { willReadFrequently: true });

  // Blend left edge
  for (let i = 0; i < blendWidth; i++) {
    const alpha = i / blendWidth;
    ctx.globalAlpha = alpha;
    for (let j = 0; j < height; j++) {
      const pxX = x + i;
      const pxY = y + j;
      if (pxX >= 0 && pxY >= 0 && pxX < originalCanvas.width && pxY < originalCanvas.height) {
        const imageData = originalCtx.getImageData(pxX, pxY, 1, 1);
        ctx.putImageData(imageData, pxX, pxY);
      }
    }
  }

  // Blend right edge
  for (let i = 0; i < blendWidth; i++) {
    const alpha = 1 - i / blendWidth;
    ctx.globalAlpha = alpha;
    for (let j = 0; j < height; j++) {
      const pxX = x + width - i;
      const pxY = y + j;
      if (pxX >= 0 && pxY >= 0 && pxX < originalCanvas.width && pxY < originalCanvas.height) {
        const imageData = originalCtx.getImageData(pxX, pxY, 1, 1);
        ctx.putImageData(imageData, pxX, pxY);
      }
    }
  }

  ctx.globalAlpha = 1.0;
}

/**
 * Export canvas as PNG Blob
 * @param {HTMLCanvasElement} canvas - Canvas to export
 * @returns {Promise<Blob>} PNG blob
 */
export async function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Failed to export canvas"));
      }
    }, "image/png");
  });
}

/**
 * Download canvas as PNG file
 * @param {HTMLCanvasElement} canvas - Canvas to download
 * @param {string} filename - Desired filename
 */
export async function downloadCanvas(canvas, filename = "face-swap-result.png") {
  const blob = await canvasToBlob(canvas);
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
