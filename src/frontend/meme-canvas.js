/**
 * Canvas renderer for classic top/bottom-text memes.
 *
 * drawMeme paints a base image onto a canvas, sizes the canvas to match the
 * image, and overlays caption boxes in the classic meme style: bold Impact,
 * white fill with a thick black stroke, uppercase by convention. Each text
 * box is positioned by normalized 0..1 coordinates so the same layout works
 * across template aspect ratios.
 */

/**
 * @typedef {Object} TextBox
 * @property {string} text - The caption to draw.
 * @property {number} x - Normalized x of the text box center (0..1).
 * @property {number} y - Normalized y of the text box center (0..1).
 * @property {number} [maxWidth=0.9] - Normalized max width of the box (0..1).
 * @property {number} [fontSize] - Font size in canvas pixels. Defaults to 8% of canvas height.
 * @property {"left"|"center"|"right"} [align="center"] - Horizontal alignment.
 * @property {string} [fillStyle="#ffffff"] - Fill color.
 * @property {string} [strokeStyle="#000000"] - Outline color.
 */

const DEFAULT_FONT_FAMILY = '"Impact", "Anton", "Oswald", "Arial Black", sans-serif';

/**
 * Draw a meme onto a canvas: base image first, then text overlays.
 *
 * The canvas is resized to match the natural dimensions of `img` so output
 * resolution matches the source template. Word wrapping is performed greedily
 * per text box using the configured max width.
 *
 * @param {HTMLCanvasElement} canvas - The target canvas element.
 * @param {HTMLImageElement|CanvasImageSource} img - Base image (already loaded).
 * @param {TextBox[]} [textBoxes=[]] - Caption boxes to overlay.
 * @returns {void}
 * @throws {TypeError} If canvas or img is missing, or if a text box is malformed.
 */
export function drawMeme(canvas, img, textBoxes = []) {
  if (!canvas || typeof canvas.getContext !== "function") {
    throw new TypeError("drawMeme: canvas must be an HTMLCanvasElement");
  }
  if (!img) {
    throw new TypeError("drawMeme: img is required");
  }
  if (!Array.isArray(textBoxes)) {
    throw new TypeError("drawMeme: textBoxes must be an array");
  }

  const width = img.naturalWidth ?? img.width;
  const height = img.naturalHeight ?? img.height;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  for (const box of textBoxes) {
    drawTextBox(ctx, box, width, height);
  }
}

/**
 * Render a single text box with classic meme styling onto the given context.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {TextBox} box
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @returns {void}
 */
function drawTextBox(ctx, box, canvasWidth, canvasHeight) {
  if (!box || typeof box.text !== "string") {
    throw new TypeError("drawMeme: each text box must have a string `text`");
  }
  const text = box.text.toUpperCase();
  if (text.length === 0) return;

  const fontSize = box.fontSize ?? Math.round(canvasHeight * 0.08);
  const maxWidth = (box.maxWidth ?? 0.9) * canvasWidth;
  const align = box.align ?? "center";
  const fillStyle = box.fillStyle ?? "#ffffff";
  const strokeStyle = box.strokeStyle ?? "#000000";

  ctx.font = `bold ${fontSize}px ${DEFAULT_FONT_FAMILY}`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillStyle = fillStyle;
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = Math.max(2, Math.round(fontSize * 0.12));
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;

  const lines = wrapText(ctx, text, maxWidth);
  const lineHeight = fontSize * 1.05;
  const blockHeight = lines.length * lineHeight;
  const cx = (box.x ?? 0.5) * canvasWidth;
  const cy = (box.y ?? 0.5) * canvasHeight;
  const startY = cy - blockHeight / 2 + lineHeight / 2;

  lines.forEach((line, i) => {
    const y = startY + i * lineHeight;
    ctx.strokeText(line, cx, y);
    ctx.fillText(line, cx, y);
  });
}

/**
 * Greedy word-wrap a string to lines that fit within `maxWidth` on `ctx`.
 *
 * @param {CanvasRenderingContext2D} ctx - Already configured with the desired font.
 * @param {string} text
 * @param {number} maxWidth - Maximum line width in pixels.
 * @returns {string[]} Wrapped lines (always at least one entry).
 */
function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const lines = [];
  let current = words[0];
  for (let i = 1; i < words.length; i++) {
    const candidate = `${current} ${words[i]}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

export const __testing = { wrapText, DEFAULT_FONT_FAMILY };
