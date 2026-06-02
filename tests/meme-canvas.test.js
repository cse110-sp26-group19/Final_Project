import { test } from "node:test";
import assert from "node:assert/strict";

import { drawMeme, __testing } from "../src/frontend/meme-canvas.js";

function makeContext() {
  const calls = [];
  return {
    calls,
    clearRect: (...a) => calls.push(["clearRect", ...a]),
    drawImage: (...a) => calls.push(["drawImage", a[0]?.tag ?? "img", ...a.slice(1)]),
    fillText: (...a) => calls.push(["fillText", ...a]),
    strokeText: (...a) => calls.push(["strokeText", ...a]),
    measureText: (s) => ({ width: s.length * 10 }),
    set font(v) {
      calls.push(["font", v]);
    },
    set textAlign(v) {
      calls.push(["textAlign", v]);
    },
    set textBaseline(v) {
      calls.push(["textBaseline", v]);
    },
    set fillStyle(v) {
      calls.push(["fillStyle", v]);
    },
    set strokeStyle(v) {
      calls.push(["strokeStyle", v]);
    },
    set lineWidth(v) {
      calls.push(["lineWidth", v]);
    },
    set lineJoin(v) {
      calls.push(["lineJoin", v]);
    },
    set miterLimit(v) {
      calls.push(["miterLimit", v]);
    },
  };
}

function makeCanvas(ctx) {
  return {
    width: 0,
    height: 0,
    getContext: () => ctx,
  };
}

const fakeImg = { tag: "fake-img", naturalWidth: 400, naturalHeight: 300 };

test("drawMeme rejects bad inputs", () => {
  assert.throws(() => drawMeme(null, fakeImg, []), /HTMLCanvasElement/);
  assert.throws(() => drawMeme(makeCanvas(makeContext()), null, []), /img is required/);
  assert.throws(() => drawMeme(makeCanvas(makeContext()), fakeImg, "nope"), /must be an array/);
});

test("drawMeme sizes the canvas to the image and draws the base image", () => {
  const ctx = makeContext();
  const canvas = makeCanvas(ctx);
  drawMeme(canvas, fakeImg, []);
  assert.equal(canvas.width, 400);
  assert.equal(canvas.height, 300);
  assert.ok(ctx.calls.some((c) => c[0] === "clearRect"));
  assert.ok(ctx.calls.some((c) => c[0] === "drawImage"));
});

test("drawMeme overlays text in classic style (white fill + black stroke + Impact)", () => {
  const ctx = makeContext();
  const canvas = makeCanvas(ctx);
  drawMeme(canvas, fakeImg, [{ text: "Hello", x: 0.5, y: 0.1 }]);

  const fontCall = ctx.calls.find((c) => c[0] === "font");
  assert.ok(fontCall && /Impact/.test(fontCall[1]), "font should include Impact");

  const fillStyle = ctx.calls.find((c) => c[0] === "fillStyle");
  const strokeStyle = ctx.calls.find((c) => c[0] === "strokeStyle");
  assert.equal(fillStyle[1], "#ffffff");
  assert.equal(strokeStyle[1], "#000000");

  const fill = ctx.calls.find((c) => c[0] === "fillText");
  const stroke = ctx.calls.find((c) => c[0] === "strokeText");
  assert.equal(fill[1], "HELLO");
  assert.equal(stroke[1], "HELLO");
});

test("drawMeme draws multiple text boxes", () => {
  const ctx = makeContext();
  const canvas = makeCanvas(ctx);
  drawMeme(canvas, fakeImg, [
    { text: "top", x: 0.5, y: 0.1 },
    { text: "bottom", x: 0.5, y: 0.9 },
  ]);
  const fills = ctx.calls.filter((c) => c[0] === "fillText").map((c) => c[1]);
  assert.deepEqual(fills, ["TOP", "BOTTOM"]);
});

test("wrapText wraps when greedy line exceeds maxWidth", () => {
  const ctx = { measureText: (s) => ({ width: s.length * 10 }) };
  const lines = __testing.wrapText(ctx, "ONE TWO THREE FOUR", 50);
  assert.ok(lines.length > 1);
  assert.equal(lines.join(" "), "ONE TWO THREE FOUR");
});

test("wrapText returns a single line when text fits", () => {
  const ctx = { measureText: (s) => ({ width: s.length * 10 }) };
  const lines = __testing.wrapText(ctx, "HI", 1000);
  assert.deepEqual(lines, ["HI"]);
});
