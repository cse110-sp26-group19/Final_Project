/**
 * Image loading helpers for meme templates and user uploads.
 *
 * Both helpers resolve to a fully-decoded HTMLImageElement so callers can pass
 * the result straight into a canvas drawImage() call without further setup.
 *
 * Note on CORS: loadImage sets `crossOrigin = "anonymous"` so the bitmap is
 * eligible for canvas pixel reads / export. Imgflip's CDN does not currently
 * send `Access-Control-Allow-Origin: *`, so a cross-origin load will succeed
 * visually but mark the canvas as tainted and break exportMeme. See the PR
 * description for the workaround plan.
 */

/**
 * Load a remote image as an HTMLImageElement with anonymous CORS.
 *
 * @param {string} url - Absolute image URL (e.g. an Imgflip template URL).
 * @param {Object} [options]
 * @param {typeof Image} [options.ImageCtor] - Image constructor (defaults to global Image).
 * @returns {Promise<HTMLImageElement>} An image element that has finished loading.
 * @throws {TypeError} If `url` is not a non-empty string.
 * @throws {Error} If the network load fails or no Image constructor is available.
 */
export function loadImage(url, options = {}) {
  if (typeof url !== "string" || url.length === 0) {
    throw new TypeError("loadImage: url must be a non-empty string");
  }
  const ImageCtor = options.ImageCtor ?? (typeof Image !== "undefined" ? Image : null);
  if (!ImageCtor) {
    throw new Error("loadImage: no Image constructor available");
  }

  return new Promise((resolve, reject) => {
    const img = new ImageCtor();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`loadImage: failed to load ${url}`));
    img.src = url;
  });
}

/**
 * Load a user-uploaded photo from a File (or Blob) into an HTMLImageElement.
 *
 * Uses FileReader to read the file as a base64 data URL and then hands that to
 * an Image element. Data URLs are same-origin, so the resulting canvas will
 * not be tainted by this path.
 *
 * @param {File|Blob} file - The user-selected file from an <input type="file"> or drop event.
 * @param {Object} [options]
 * @param {typeof FileReader} [options.FileReaderCtor] - FileReader constructor (defaults to global).
 * @param {typeof Image} [options.ImageCtor] - Image constructor (defaults to global Image).
 * @returns {Promise<HTMLImageElement>} An image element that has finished loading.
 * @throws {TypeError} If `file` is missing or not Blob-like.
 */
export function loadUserPhoto(file, options = {}) {
  if (!file || typeof file !== "object" || typeof file.size !== "number") {
    throw new TypeError("loadUserPhoto: file must be a File or Blob");
  }
  const FileReaderCtor =
    options.FileReaderCtor ?? (typeof FileReader !== "undefined" ? FileReader : null);
  const ImageCtor = options.ImageCtor ?? (typeof Image !== "undefined" ? Image : null);
  if (!FileReaderCtor || !ImageCtor) {
    return Promise.reject(new Error("loadUserPhoto: missing FileReader or Image constructor"));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReaderCtor();
    reader.onerror = () => reject(new Error("loadUserPhoto: FileReader error"));
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string") {
        reject(new Error("loadUserPhoto: FileReader did not return a data URL"));
        return;
      }
      const img = new ImageCtor();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("loadUserPhoto: image decode failed"));
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
