import test from "node:test";
import assert from "node:assert/strict";

import { generateMockMeme, resolveTemplate } from "./pipeline.js";

// --- resolveTemplate ---

test("resolveTemplate returns a template object for a known ID", () => {
  const template = resolveTemplate("IMG_1");
  assert.equal(typeof template, "object");
  assert.equal(typeof template.context, "string");
  assert.ok(template.context.length > 0);
});

test("resolveTemplate returns different templates for different IDs", () => {
  const t1 = resolveTemplate("IMG_1");
  const t2 = resolveTemplate("IMG_2");
  assert.notEqual(t1.context, t2.context);
});

test("resolveTemplate throws TypeError for an unknown template ID", () => {
  assert.throws(() => resolveTemplate("UNKNOWN_ID"), TypeError);
});

test("resolveTemplate throws TypeError for an empty string", () => {
  assert.throws(() => resolveTemplate(""), TypeError);
});

// --- generateMockMeme ---

test("generateMockMeme returns expected response shape", () => {
  const result = generateMockMeme({
    templateId: "IMG_1",
    userImage: "mock-user-image.png",
  });

  assert.equal(typeof result, "object");
  assert.equal(result.metadata.pipeline, "c");
  assert.ok("image" in result);
  assert.ok("text" in result);
  assert.ok("placement" in result);
  assert.ok("metadata" in result);
  assert.equal(result.metadata.pipeline, "c");
  assert.equal(result.metadata.userImage, "mock-user-image.png");
});

test("generateMockMeme embeds template context in metadata", () => {
  const result = generateMockMeme({
    templateId: "IMG_2",
    userImage: "mock.png",
  });
  assert.equal(typeof result.metadata.templateContext, "string");
  assert.ok(result.metadata.templateContext.length > 0);
});

test("generateMockMeme throws for an unknown templateId", () => {
  assert.throws(() => generateMockMeme({ templateId: "BAD_ID", userImage: "mock.png" }), TypeError);
});

// --- imageZone ---

test("generateMockMeme returns imageZone for IMG_4 (two-button sweating guy)", () => {
  const result = generateMockMeme({ templateId: "IMG_4", userImage: "mock.png" });
  assert.ok(result.imageZone !== undefined, "imageZone should be present");
  assert.equal(typeof result.imageZone.x, "number");
  assert.equal(typeof result.imageZone.y, "number");
  assert.equal(typeof result.imageZone.w, "number");
  assert.equal(typeof result.imageZone.h, "number");
});

test("generateMockMeme imageZone coordinates are normalized between 0 and 1", () => {
  const result = generateMockMeme({ templateId: "IMG_4", userImage: "mock.png" });
  const { x, y, w, h } = result.imageZone;
  assert.ok(x >= 0 && x <= 1, "x must be 0..1");
  assert.ok(y >= 0 && y <= 1, "y must be 0..1");
  assert.ok(w > 0 && w <= 1, "w must be 0..1");
  assert.ok(h > 0 && h <= 1, "h must be 0..1");
});

test("generateMockMeme returns imageZone null for templates without one", () => {
  const result = generateMockMeme({ templateId: "IMG_2", userImage: "mock.png" });
  assert.equal(result.imageZone, null);
});
