import { test } from "node:test";
import assert from "node:assert/strict";

import { FLOW, firstUnfinishedStep, guardRedirect } from "../src/frontend/lib/routing-guard.js";

// Progress snapshots for the four meaningful states of the funnel.
const NOTHING = { hasPhoto: false, hasTemplate: false, hasMeme: false };
const PHOTO_ONLY = { hasPhoto: true, hasTemplate: false, hasMeme: false };
const PHOTO_AND_TEMPLATE = { hasPhoto: true, hasTemplate: true, hasMeme: false };
const COMPLETE = { hasPhoto: true, hasTemplate: true, hasMeme: true };

test("FLOW lists the four steps in funnel order", () => {
  assert.deepEqual(FLOW, ["upload", "templates", "edit", "result"]);
});

test("firstUnfinishedStep returns the earliest missing prerequisite", () => {
  assert.equal(firstUnfinishedStep(NOTHING), "upload");
  assert.equal(firstUnfinishedStep(PHOTO_ONLY), "templates");
  assert.equal(firstUnfinishedStep(PHOTO_AND_TEMPLATE), "edit");
  assert.equal(firstUnfinishedStep(COMPLETE), "result");
});

test("upload page is always reachable (entry point)", () => {
  assert.equal(guardRedirect("upload", NOTHING), null);
  assert.equal(guardRedirect("upload", COMPLETE), null);
});

test("templates page requires a photo, else redirects to upload", () => {
  assert.equal(guardRedirect("templates", NOTHING), "upload");
  assert.equal(guardRedirect("templates", PHOTO_ONLY), null);
  assert.equal(guardRedirect("templates", COMPLETE), null);
});

test("edit page requires photo and template, redirecting to the earliest gap", () => {
  assert.equal(guardRedirect("edit", NOTHING), "upload");
  assert.equal(guardRedirect("edit", PHOTO_ONLY), "templates");
  assert.equal(guardRedirect("edit", PHOTO_AND_TEMPLATE), null);
  assert.equal(guardRedirect("edit", COMPLETE), null);
});

test("result page requires a generated meme, redirecting to the earliest gap", () => {
  assert.equal(guardRedirect("result", NOTHING), "upload");
  assert.equal(guardRedirect("result", PHOTO_ONLY), "templates");
  assert.equal(guardRedirect("result", PHOTO_AND_TEMPLATE), "edit");
  assert.equal(guardRedirect("result", COMPLETE), null);
});

test("a guard never redirects a page to itself (no redirect loops)", () => {
  for (const page of FLOW) {
    for (const progress of [NOTHING, PHOTO_ONLY, PHOTO_AND_TEMPLATE, COMPLETE]) {
      assert.notEqual(guardRedirect(page, progress), page, `${page} redirected to itself`);
    }
  }
});

test("an unknown page is never guarded", () => {
  assert.equal(guardRedirect("about", NOTHING), null);
});
