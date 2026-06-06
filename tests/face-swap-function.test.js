import { test } from "node:test";
import assert from "node:assert/strict";

import {
  ALLOWED_FACE_MIME,
  ALLOWED_TEMPLATE_HOSTS,
  validateFaceSwapInput,
} from "../functions/api/face-swap.js";

const VALID_FACE = "data:image/png;base64,iVBORw0KGgo=";
const VALID_TEMPLATE = "https://i.imgflip.com/abc.jpg";

test("accepts a valid face data URL + allowed template host", () => {
  assert.deepEqual(
    validateFaceSwapInput({ faceDataUrl: VALID_FACE, templateUrl: VALID_TEMPLATE }),
    {
      ok: true,
    }
  );
});

test("rejects a missing or non-image face data URL with 400", () => {
  assert.equal(validateFaceSwapInput({ templateUrl: VALID_TEMPLATE }).ok, false);
  const bad = validateFaceSwapInput({
    faceDataUrl: "data:text/plain;base64,xx",
    templateUrl: VALID_TEMPLATE,
  });
  assert.equal(bad.ok, false);
  assert.equal(bad.status, 400);
});

test("rejects HEIC faces (Replicate can't process them)", () => {
  const result = validateFaceSwapInput({
    faceDataUrl: "data:image/heic;base64,xx",
    templateUrl: VALID_TEMPLATE,
  });
  assert.equal(result.ok, false);
  assert.equal(result.status, 400);
});

test("rejects a non-HTTP or malformed template url with 400", () => {
  assert.equal(
    validateFaceSwapInput({ faceDataUrl: VALID_FACE, templateUrl: "ftp://x/y" }).status,
    400
  );
  assert.equal(validateFaceSwapInput({ faceDataUrl: VALID_FACE, templateUrl: "nope" }).status, 400);
});

test("rejects a disallowed template host with 403 (SSRF guard)", () => {
  const result = validateFaceSwapInput({
    faceDataUrl: VALID_FACE,
    templateUrl: "https://evil.example.com/x.jpg",
  });
  assert.equal(result.ok, false);
  assert.equal(result.status, 403);
});

test("accepts every allowed template host", () => {
  for (const host of ALLOWED_TEMPLATE_HOSTS) {
    assert.equal(
      validateFaceSwapInput({ faceDataUrl: VALID_FACE, templateUrl: `https://${host}/x.jpg` }).ok,
      true
    );
  }
});

test("ALLOWED_FACE_MIME matches jpeg/png/webp only", () => {
  assert.match("data:image/jpeg;base64,x", ALLOWED_FACE_MIME);
  assert.match("data:image/webp;base64,x", ALLOWED_FACE_MIME);
  assert.doesNotMatch("data:image/gif;base64,x", ALLOWED_FACE_MIME);
});
