/**
 * ReplicateClient Unit Tests
 * Tests core functionality: image conversion, API interactions, polling, and retry logic
 * Uses Node.js built-in test runner with mocked axios
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import ReplicateClient from "../src/backend/replicate-client.js";
import axios from "axios";

// Set test token before tests
process.env.REPLICATE_API_TOKEN = "test-token-123";

/**
 * Constructor: should initialize with environment variable and set default model ID
 * Setup: env var REPLICATE_API_TOKEN set to "test-token-123"
 * Verifies: client.apiToken matches env var and model ID contains "face-swap"
 */
test("constructor - initialize with env var and config", () => {
  const client = new ReplicateClient();
  assert.strictEqual(client.apiToken, "test-token-123");
  assert(client.modelId.includes("face-swap"));
});

/**
 * Constructor: should throw error if API token is missing
 * Setup: REPLICATE_API_TOKEN deleted from environment
 * Verifies: constructor throws error containing "REPLICATE_API_TOKEN"
 */
test("constructor - throw without API token", () => {
  delete process.env.REPLICATE_API_TOKEN;
  assert.throws(() => new ReplicateClient(), /REPLICATE_API_TOKEN/);
  process.env.REPLICATE_API_TOKEN = "test-token-123";
});

/**
 * createPrediction: should successfully create API prediction and return prediction ID
 * Setup: mock axios.post to return prediction with id "pred-123"
 * Verifies: returns prediction ID string
 */
test("createPrediction - success", async (t) => {
  const origPost = axios.post;
  t.mock.method(axios, "post", () => Promise.resolve({ data: { id: "pred-123" } }));
  const id = await new ReplicateClient().createPrediction("data:a", "data:b");
  assert.strictEqual(id, "pred-123");
  axios.post = origPost;
});

/**
 * createPrediction: should handle 401 invalid token error from Replicate API
 * Setup: mock axios.post to reject with 401 status
 * Verifies: throws error containing "Invalid API token"
 */
test("createPrediction - 401 invalid token", async (t) => {
  const origPost = axios.post;
  t.mock.method(axios, "post", () => Promise.reject({ response: { status: 401 } }));
  await assert.rejects(
    () => new ReplicateClient().createPrediction("data:a", "data:b"),
    /Invalid API token/
  );
  axios.post = origPost;
});

/**
 * createPrediction: should handle 402 insufficient credits error
 * Setup: mock axios.post to reject with 402 status
 * Verifies: throws error containing "Insufficient credits"
 */
test("createPrediction - 402 insufficient credits", async (t) => {
  const origPost = axios.post;
  t.mock.method(axios, "post", () => Promise.reject({ response: { status: 402 } }));
  await assert.rejects(
    () => new ReplicateClient().createPrediction("data:a", "data:b"),
    /Insufficient credits/
  );
  axios.post = origPost;
});

/**
 * pollPrediction: should return prediction object when status is "succeeded"
 * Setup: mock axios.get to return succeeded prediction with output URL
 * Verifies: result.status equals "succeeded"
 */
test("pollPrediction - return succeeded", async (t) => {
  const origGet = axios.get;
  t.mock.method(axios, "get", () => Promise.resolve({
    data: { status: "succeeded", output: "url" }
  }));
  const result = await new ReplicateClient().pollPrediction("pred-123");
  assert.strictEqual(result.status, "succeeded");
  axios.get = origGet;
});

/**
 * pollPrediction: should return failed status when prediction fails
 * Setup: mock axios.get to return failed prediction
 * Verifies: result.status equals "failed"
 */
test("pollPrediction - return failed", async (t) => {
  const origGet = axios.get;
  t.mock.method(axios, "get", () => Promise.resolve({
    data: { status: "failed", error: "Face not detected" }
  }));
  const result = await new ReplicateClient().pollPrediction("pred-123");
  assert.strictEqual(result.status, "failed");
  axios.get = origGet;
});

/**
 * pollPrediction: should throw error if polling exceeds configured timeout
 * Setup: set timeout to 100ms, mock axios.get to always return "processing" status
 * Verifies: throws error containing "Polling timeout"
 */
test("pollPrediction - timeout on processing", async (t) => {
  const origGet = axios.get;
  t.mock.method(axios, "get", () => Promise.resolve({ data: { status: "processing" } }));
  await assert.rejects(
    () => new ReplicateClient({ timeout: 100 }).pollPrediction("pred-123"),
    /Polling timeout/
  );
  axios.get = origGet;
});
