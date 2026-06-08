import assert from "node:assert/strict";
import test from "node:test";

import { defaultTextBoxes, labelForBox } from "../src/frontend/lib/text-boxes.js";

test("defaultTextBoxes returns one centered box for count 1", () => {
  assert.deepEqual(defaultTextBoxes(1), [{ text: "", x: 0.5, y: 0.5 }]);
});

test("defaultTextBoxes treats count 0 as one centered box", () => {
  assert.deepEqual(defaultTextBoxes(0), [{ text: "", x: 0.5, y: 0.5 }]);
});

test("defaultTextBoxes spaces two boxes at top and bottom", () => {
  assert.deepEqual(defaultTextBoxes(2), [
    { text: "", x: 0.5, y: 0.1 },
    { text: "", x: 0.5, y: 0.9 },
  ]);
});

test("defaultTextBoxes evenly spaces five boxes", () => {
  assert.deepEqual(
    defaultTextBoxes(5).map((box) => box.y),
    [0.1, 0.30000000000000004, 0.5, 0.7000000000000001, 0.9]
  );
});

test("labelForBox returns Top text for the first box", () => {
  assert.equal(labelForBox(0, 3), "Top text");
});

test("labelForBox returns Bottom text for the last box", () => {
  assert.equal(labelForBox(2, 3), "Bottom text");
});

test("labelForBox returns numbered labels for middle boxes", () => {
  assert.equal(labelForBox(1, 3), "Text 2");
});
