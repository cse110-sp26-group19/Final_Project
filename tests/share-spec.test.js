import assert from "node:assert/strict";
import test from "node:test";

import { decodeSpec, encodeSpec } from "../src/frontend/lib/share-spec.js";

test("encodeSpec and decodeSpec round-trip plain ASCII specs", () => {
  const spec = {
    templateName: "Drake Hotline Bling",
    templateUrl: "https://example.com/drake.png",
    textBoxes: [{ text: "hello", x: 0.5, y: 0.1 }],
  };

  assert.deepEqual(decodeSpec(encodeSpec(spec)), spec);
});

test("encodeSpec and decodeSpec round-trip unicode specs", () => {
  const spec = {
    templateName: "unicode meme",
    textBoxes: [{ text: "bruh moment \u{1f624} caf\u00e9", x: 0.5, y: 0.9 }],
  };

  assert.deepEqual(decodeSpec(encodeSpec(spec)), spec);
});

test("encodeSpec produces different strings for different specs", () => {
  const first = encodeSpec({ templateName: "first", textBoxes: [] });
  const second = encodeSpec({ templateName: "second", textBoxes: [] });

  assert.notEqual(first, second);
  assert.match(first, /^[A-Za-z0-9+/=]+$/);
});

test("decodeSpec returns null for malformed base64 input", () => {
  assert.equal(decodeSpec("not valid base64 %%%"), null);
});

test("decodeSpec returns null for encoded non-json input", () => {
  assert.equal(decodeSpec(btoa("not json")), null);
});

test("decodeSpec returns null for missing input", () => {
  assert.equal(decodeSpec(null), null);
  assert.equal(decodeSpec(""), null);
});
