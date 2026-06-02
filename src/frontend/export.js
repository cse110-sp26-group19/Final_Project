/**
 * Canvas → PNG download helper.
 *
 * Converts the current state of a canvas into a Blob and triggers a browser
 * download via a temporary anchor element. PNG is hard-coded because it is
 * the only format with broad lossless support across browsers and gives the
 * best result for memes (sharp text edges, no compression artifacts).
 *
 * Known limitation: if the canvas has been tainted by a cross-origin image
 * load (see image-loader.js), toBlob will throw a SecurityError. This is the
 * Imgflip CORS issue called out in the PR description.
 */

/**
 * Export a canvas as a downloadable PNG.
 *
 * @param {HTMLCanvasElement} canvas - The canvas to export.
 * @param {string} [filename="meme.png"] - Suggested filename for the download.
 * @param {Object} [options]
 * @param {Document} [options.documentRef] - Document to use (defaults to global document).
 * @param {typeof URL} [options.URLRef] - URL constructor (defaults to global URL).
 * @returns {Promise<void>} Resolves once the download has been triggered.
 * @throws {TypeError} If canvas is missing or not a canvas element.
 * @throws {Error} If toBlob fails (e.g., tainted canvas) or required globals are unavailable.
 */
export function exportMeme(canvas, filename = "meme.png", options = {}) {
  if (!canvas || typeof canvas.toBlob !== "function") {
    throw new TypeError("exportMeme: canvas must be an HTMLCanvasElement");
  }
  const documentRef = options.documentRef ?? (typeof document !== "undefined" ? document : null);
  const URLRef = options.URLRef ?? (typeof URL !== "undefined" ? URL : null);
  if (!documentRef || !URLRef) {
    throw new Error("exportMeme: requires document and URL globals");
  }

  const safeName = filename.endsWith(".png") ? filename : `${filename}.png`;

  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("exportMeme: canvas.toBlob produced no blob"));
          return;
        }
        const url = URLRef.createObjectURL(blob);
        const anchor = documentRef.createElement("a");
        anchor.href = url;
        anchor.download = safeName;
        anchor.rel = "noopener";
        documentRef.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URLRef.revokeObjectURL(url);
        resolve();
      }, "image/png");
    } catch (err) {
      reject(err);
    }
  });
}
