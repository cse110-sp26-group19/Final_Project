import { test } from "node:test";
import assert from "node:assert/strict";

import {
  FLOW,
  nextIncompleteStep,
  guardRedirect,
  stepMeta,
} from "../src/frontend/lib/routing-guard.js";

// Progress snapshots. The two inputs (photo, template) can be done in any
// order, so both single-input states are meaningful.
const NOTHING = { hasPhoto: false, hasTemplate: false, hasMeme: false };
const PHOTO_ONLY = { hasPhoto: true, hasTemplate: false, hasMeme: false };
const TEMPLATE_ONLY = { hasPhoto: false, hasTemplate: true, hasMeme: false };
const BOTH_INPUTS = { hasPhoto: true, hasTemplate: true, hasMeme: false };
const COMPLETE = { hasPhoto: true, hasTemplate: true, hasMeme: true };

test("FLOW lists the four steps in funnel order", () => {
  assert.deepEqual(FLOW, ["upload", "templates", "edit", "result"]);
});

test("nextIncompleteStep points at the next thing to do", () => {
  assert.equal(nextIncompleteStep(NOTHING), "templates");
  assert.equal(nextIncompleteStep(TEMPLATE_ONLY), "upload");
  assert.equal(nextIncompleteStep(PHOTO_ONLY), "templates");
  assert.equal(nextIncompleteStep(BOTH_INPUTS), "edit");
  assert.equal(nextIncompleteStep(COMPLETE), "result");
});

test("upload and templates are always reachable (interchangeable inputs)", () => {
  for (const progress of [NOTHING, PHOTO_ONLY, TEMPLATE_ONLY, BOTH_INPUTS, COMPLETE]) {
    assert.equal(guardRedirect("upload", progress), null);
    assert.equal(guardRedirect("templates", progress), null);
  }
});

test("edit requires both inputs, redirecting to whichever is missing", () => {
  assert.equal(guardRedirect("edit", NOTHING), "templates");
  assert.equal(guardRedirect("edit", PHOTO_ONLY), "templates");
  assert.equal(guardRedirect("edit", TEMPLATE_ONLY), "upload");
  assert.equal(guardRedirect("edit", BOTH_INPUTS), null);
  assert.equal(guardRedirect("edit", COMPLETE), null);
});

test("result requires a generated meme, else routes to the next incomplete step", () => {
  assert.equal(guardRedirect("result", NOTHING), "templates");
  assert.equal(guardRedirect("result", TEMPLATE_ONLY), "upload");
  assert.equal(guardRedirect("result", BOTH_INPUTS), "edit");
  assert.equal(guardRedirect("result", COMPLETE), null);
});

test("a guard never redirects a page to itself (no redirect loops)", () => {
  for (const page of FLOW) {
    for (const progress of [NOTHING, PHOTO_ONLY, TEMPLATE_ONLY, BOTH_INPUTS, COMPLETE]) {
      assert.notEqual(guardRedirect(page, progress), page, `${page} redirected to itself`);
    }
  }
});

test("an unknown page is never guarded", () => {
  assert.equal(guardRedirect("about", NOTHING), null);
});

test("step indicator numbers the inputs by completion order", () => {
  // Whichever input you do first is Step 1; the second is Step 2.
  assert.equal(stepMeta("upload", NOTHING), "Step 1 of 3 · Upload");
  assert.equal(stepMeta("upload", TEMPLATE_ONLY), "Step 2 of 3 · Upload");
  assert.equal(stepMeta("templates", NOTHING), "Step 1 of 3 · Meme Selection");
  assert.equal(stepMeta("templates", PHOTO_ONLY), "Step 2 of 3 · Meme Selection");
  assert.equal(stepMeta("edit", BOTH_INPUTS), "Step 3 of 3 · Edit");
  assert.equal(stepMeta("result", COMPLETE), "");
});
