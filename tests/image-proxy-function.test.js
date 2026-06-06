import { test } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_TEMPLATE_HOSTS, validateTargetUrl } from "../functions/api/image-proxy.js";

test("rejects a missing url with 400", () => {
  assert.deepEqual(validateTargetUrl(undefined), {
    ok: false,
    status: 400,
    error: "url query param is required",
  });
  assert.equal(validateTargetUrl("").ok, false);
});

test("rejects a malformed url with 400", () => {
  const result = validateTargetUrl("not a url");
  assert.equal(result.ok, false);
  assert.equal(result.status, 400);
});

test("rejects a disallowed host with 403 (SSRF guard)", () => {
  const result = validateTargetUrl("https://evil.example.com/x.png");
  assert.equal(result.ok, false);
  assert.equal(result.status, 403);
  assert.match(result.error, /evil\.example\.com/);
});

test("accepts allowed imgflip hosts", () => {
  for (const host of ALLOWED_TEMPLATE_HOSTS) {
    const result = validateTargetUrl(`https://${host}/abc.jpg`);
    assert.equal(result.ok, true, `${host} should be allowed`);
    assert.equal(result.url, `https://${host}/abc.jpg`);
  }
});
