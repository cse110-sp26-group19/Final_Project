/**
 * Server unit + integration tests
 *
 * Integration tests start a real Express instance on port 0 (OS picks a free
 * port), hit it with Node's built-in fetch, then close it. Unit tests exercise
 * private helpers exported via __testing without making any network calls.
 *
 * What is NOT covered here (requires the live Replicate API):
 *   - A fully succeeded face-swap round-trip through ReplicateClient
 */

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import axios from "axios";

import { app, __testing } from "../src/backend/server.js";

const { fetchAsDataUrl, ALLOWED_FACE_MIME, ALLOWED_TEMPLATE_HOSTS } = __testing;

// Minimal valid face data URL used across tests (1×1 white PNG, base64)
const VALID_FACE_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==";

const VALID_TEMPLATE_URL = "https://i.imgflip.com/1bij.jpg";

// ---------------------------------------------------------------------------
// Shared server lifecycle
// ---------------------------------------------------------------------------

let server;
let baseUrl;

before(
  () =>
    new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${server.address().port}`;
        resolve();
      });
    })
);

after(() => new Promise((resolve) => server.close(resolve)));

// ---------------------------------------------------------------------------
// Unit tests — ALLOWED_FACE_MIME regex
// ---------------------------------------------------------------------------

test("ALLOWED_FACE_MIME accepts jpeg data URLs", () => {
  assert.ok(ALLOWED_FACE_MIME.test("data:image/jpeg;base64,abc123"));
});

test("ALLOWED_FACE_MIME accepts png data URLs", () => {
  assert.ok(ALLOWED_FACE_MIME.test("data:image/png;base64,abc123"));
});

test("ALLOWED_FACE_MIME accepts webp data URLs", () => {
  assert.ok(ALLOWED_FACE_MIME.test("data:image/webp;base64,abc123"));
});

test("ALLOWED_FACE_MIME rejects heic data URLs", () => {
  assert.ok(!ALLOWED_FACE_MIME.test("data:image/heic;base64,abc123"));
});

test("ALLOWED_FACE_MIME rejects plain strings", () => {
  assert.ok(!ALLOWED_FACE_MIME.test("not-a-data-url"));
});

test("ALLOWED_FACE_MIME rejects javascript: URIs", () => {
  assert.ok(!ALLOWED_FACE_MIME.test("javascript:alert(1)"));
});

// ---------------------------------------------------------------------------
// Unit tests — fetchAsDataUrl SSRF guard
// ---------------------------------------------------------------------------

test("fetchAsDataUrl rejects a disallowed host (SSRF guard)", async () => {
  await assert.rejects(
    () => fetchAsDataUrl("https://attacker.example/evil.jpg"),
    /Template host not allowed/
  );
});

test("fetchAsDataUrl rejects a localhost URL (SSRF guard)", async () => {
  await assert.rejects(
    () => fetchAsDataUrl("http://localhost/internal"),
    /Template host not allowed/
  );
});

test("fetchAsDataUrl rejects an internal IP (SSRF guard)", async () => {
  await assert.rejects(
    () => fetchAsDataUrl("http://192.168.1.1/secret"),
    /Template host not allowed/
  );
});

test("fetchAsDataUrl accepts an allowed host and returns data URL", async (t) => {
  // Mock axios.get so no real network request is made
  const fakeBuffer = Buffer.from("fakepng");
  t.mock.method(axios, "get", () =>
    Promise.resolve({
      data: fakeBuffer,
      headers: { "content-type": "image/jpeg" },
    })
  );

  const result = await fetchAsDataUrl("https://i.imgflip.com/1bij.jpg");
  assert.ok(result.startsWith("data:image/jpeg;base64,"), "should return a data URL");
});

test("ALLOWED_TEMPLATE_HOSTS contains both imgflip subdomains", () => {
  assert.ok(ALLOWED_TEMPLATE_HOSTS.includes("i.imgflip.com"));
  assert.ok(ALLOWED_TEMPLATE_HOSTS.includes("imgflip.com"));
});

// ---------------------------------------------------------------------------
// Integration tests — POST /api/face-swap input validation
// ---------------------------------------------------------------------------

test("POST /api/face-swap - empty body returns 400", async () => {
  const res = await fetch(`${baseUrl}/api/face-swap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /faceDataUrl/);
});

test("POST /api/face-swap - missing faceDataUrl returns 400", async () => {
  const res = await fetch(`${baseUrl}/api/face-swap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ templateUrl: VALID_TEMPLATE_URL }),
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /faceDataUrl/);
});

test("POST /api/face-swap - HEIC faceDataUrl returns 400", async () => {
  const res = await fetch(`${baseUrl}/api/face-swap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      faceDataUrl: "data:image/heic;base64,abc",
      templateUrl: VALID_TEMPLATE_URL,
    }),
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /faceDataUrl/);
});

test("POST /api/face-swap - non-data-URL faceDataUrl returns 400", async () => {
  const res = await fetch(`${baseUrl}/api/face-swap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      faceDataUrl: "https://evil.example/face.jpg",
      templateUrl: VALID_TEMPLATE_URL,
    }),
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /faceDataUrl/);
});

test("POST /api/face-swap - missing templateUrl returns 400", async () => {
  const res = await fetch(`${baseUrl}/api/face-swap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ faceDataUrl: VALID_FACE_DATA_URL }),
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /templateUrl/);
});

test("POST /api/face-swap - non-URL templateUrl returns 400", async () => {
  const res = await fetch(`${baseUrl}/api/face-swap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      faceDataUrl: VALID_FACE_DATA_URL,
      templateUrl: "not-a-url",
    }),
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /templateUrl/);
});

test("POST /api/face-swap - disallowed templateUrl host returns 500 (SSRF guard)", async () => {
  const res = await fetch(`${baseUrl}/api/face-swap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      faceDataUrl: VALID_FACE_DATA_URL,
      templateUrl: "https://attacker.example/meme.jpg",
    }),
  });
  // Validation passes (it's a syntactically valid URL) but fetchAsDataUrl throws
  assert.strictEqual(res.status, 500);
  const data = await res.json();
  assert.match(data.error, /Template host not allowed/);
});

test("POST /api/face-swap - no Content-Type returns 400", async () => {
  // Without JSON content-type, req.body is undefined — both fields missing
  const res = await fetch(`${baseUrl}/api/face-swap`, {
    method: "POST",
    body: "not json",
  });
  assert.strictEqual(res.status, 400);
});
