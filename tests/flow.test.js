import { test } from "node:test";
import assert from "node:assert/strict";

import {
  PAGES,
  TOTAL_STEPS,
  stepNumber,
  stepMeta,
  nextStep,
  guardTarget,
} from "../src/frontend/lib/flow.js";

// Progress snapshots. The two inputs (photo, template) can be done in any
// order, so both single-input states matter.
const NOTHING = { hasPhoto: false, hasTemplate: false, hasMeme: false };
const PHOTO_ONLY = { hasPhoto: true, hasTemplate: false, hasMeme: false };
const TEMPLATE_ONLY = { hasPhoto: false, hasTemplate: true, hasMeme: false };
const BOTH = { hasPhoto: true, hasTemplate: true, hasMeme: false };
const DONE = { hasPhoto: true, hasTemplate: true, hasMeme: true };

test("PAGES and TOTAL_STEPS are the expected shape", () => {
  assert.deepEqual(PAGES, ["upload", "templates", "edit", "result"]);
  assert.equal(TOTAL_STEPS, 3);
});

test("step number reflects which input came first", () => {
  // Start on upload (nothing yet) -> upload is step 1.
  assert.equal(stepNumber("upload", NOTHING), 1);
  // Reach upload after already picking a template -> upload is step 2.
  assert.equal(stepNumber("upload", TEMPLATE_ONLY), 2);
  // Start on templates (nothing yet) -> templates is step 1.
  assert.equal(stepNumber("templates", NOTHING), 1);
  // Reach templates after already uploading -> templates is step 2.
  assert.equal(stepNumber("templates", PHOTO_ONLY), 2);
  // Edit is always step 3; result has no step indicator.
  assert.equal(stepNumber("edit", BOTH), 3);
  assert.equal(stepNumber("result", DONE), null);
});

test("step meta renders the dynamic 'Step N of 3' line", () => {
  assert.equal(stepMeta("upload", NOTHING), "Step 1 of 3 · Upload");
  assert.equal(stepMeta("templates", PHOTO_ONLY), "Step 2 of 3 · Meme Selection");
  assert.equal(stepMeta("upload", TEMPLATE_ONLY), "Step 2 of 3 · Upload");
  assert.equal(stepMeta("edit", BOTH), "Step 3 of 3 · Edit");
  assert.equal(stepMeta("result", DONE), "");
});

test("Next from each input page leads to the other input, then edit", () => {
  // Just uploaded, no template yet -> go pick a template.
  assert.equal(nextStep("upload", PHOTO_ONLY), "templates");
  // Just picked a template, no photo yet -> go upload.
  assert.equal(nextStep("templates", TEMPLATE_ONLY), "upload");
  // Second input done -> straight to edit either way.
  assert.equal(nextStep("upload", BOTH), "edit");
  assert.equal(nextStep("templates", BOTH), "edit");
  // Edit continues to the share/result screen.
  assert.equal(nextStep("edit", BOTH), "result");
});

test("inputs are reachable in any order; edit/result require prerequisites", () => {
  for (const progress of [NOTHING, PHOTO_ONLY, TEMPLATE_ONLY, BOTH, DONE]) {
    assert.equal(guardTarget("upload", progress), null);
    assert.equal(guardTarget("templates", progress), null);
  }
  // Edit needs both inputs, redirecting to whichever is missing.
  assert.equal(guardTarget("edit", NOTHING), "templates");
  assert.equal(guardTarget("edit", PHOTO_ONLY), "templates");
  assert.equal(guardTarget("edit", TEMPLATE_ONLY), "upload");
  assert.equal(guardTarget("edit", BOTH), null);
  // Result needs a generated meme, else it routes the user to start the flow.
  assert.equal(guardTarget("result", NOTHING), "templates");
  assert.equal(guardTarget("result", TEMPLATE_ONLY), "upload");
  assert.equal(guardTarget("result", BOTH), "edit");
  assert.equal(guardTarget("result", DONE), null);
});

test("a guard never redirects a page to itself (no loops)", () => {
  for (const page of PAGES) {
    for (const progress of [NOTHING, PHOTO_ONLY, TEMPLATE_ONLY, BOTH, DONE]) {
      assert.notEqual(guardTarget(page, progress), page, `${page} redirected to itself`);
    }
  }
});
