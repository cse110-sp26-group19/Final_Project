/**
 * Face Swap API Integration Tests
 *
 * Tests the complete face swap workflow including server.js and ReplicateClient.
 * Validates all endpoints: health check, status, and face swap processing.
 *
 * @module test-api.integration
 * @requires fs
 * @requires path
 *
 * Run: node tests/test-api.integration.js
 *
 * Prerequisites:
 * - Server running: node src/backend/server.js
 * - Test fixture images: tests/fixtures/images/source.jpg, target.jpg
 * - Environment: REPLICATE_API_TOKEN set in .env
 *
 * Test Flow:
 * 1. Health check - Verify server is responsive
 * 2. Status check - Verify ReplicateClient initialization
 * 3. Face swap - Full integration test with Replicate API
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = "http://localhost:3001";
const FIXTURE_DIR = path.join(__dirname, "fixtures/images");

/**
 * Test GET /health endpoint
 *
 * Verifies server is running and responsive.
 * A healthy server indicates all middleware and routes are initialized.
 *
 * @async
 * @function testHealth
 * @returns {Promise<void>}
 * @throws {Error} Connection errors are caught and logged
 *
 * Expected Response (200):
 * { "status": "ok", "message": "Face swap API server is running" }
 */
async function testHealth() {
  console.log("1. Testing health check endpoint...");
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    console.log(`   ✅ Status: ${res.status}`);
    console.log(`   ${JSON.stringify(data, null, 2)}`);
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
  }
  console.log("");
}

/**
 * Test GET /api/status endpoint
 *
 * Verifies server state and ReplicateClient initialization.
 * Confirms REPLICATE_API_TOKEN is loaded from .env.
 *
 * @async
 * @function testStatus
 * @returns {Promise<void>}
 * @throws {Error} Connection errors are caught and logged
 *
 * Expected Response (200):
 * {
 *   "server": "running",
 *   "replicateClient": "initialized",
 *   "service": "Replicate",
 *   "outputDir": "/path/to/generated/images"
 * }
 */
async function testStatus() {
  console.log("2. Testing status endpoint...");
  try {
    const res = await fetch(`${BASE_URL}/api/status`);
    const data = await res.json();
    console.log(`   ✅ Status: ${res.status}`);
    console.log(`   ${JSON.stringify(data, null, 2)}`);
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
  }
  console.log("");
}

/**
 * Test POST /api/swap endpoint
 *
 * Full integration test of face swap workflow:
 * 1. Load fixture images from disk
 * 2. Validate files exist
 * 3. Upload as multipart form data
 * 4. Server processes via ReplicateClient
 * 5. Verify response contains HTTP URL to swapped image
 *
 * @async
 * @function testFaceSwap
 * @returns {Promise<void>}
 * @throws {Error} File system and network errors are caught and logged
 *
 * Expected Response (200):
 * {
 *   "success": true,
 *   "message": "Face swap completed successfully",
 *   "result": {
 *     "outputPath": "http://localhost:3001/images/swapped_<timestamp>.png",
 *     "predictionId": "pred-<id>",
 *     "attempt": 1,
 *     "timestamp": "2026-06-01T..."
 *   }
 * }
 *
 * Error Cases:
 * - 400: Missing or invalid files
 * - 500: Replicate API error (invalid token, insufficient credits, etc.)
 */
async function testFaceSwap() {
  console.log("3. Testing face swap with fixture images...");

  const sourceFile = path.join(FIXTURE_DIR, "source.jpg");
  const targetFile = path.join(FIXTURE_DIR, "target.jpg");

  // Validate files exist
  if (!fs.existsSync(sourceFile)) {
    console.error(`   ❌ Source file not found: ${sourceFile}`);
    return;
  }
  if (!fs.existsSync(targetFile)) {
    console.error(`   ❌ Target file not found: ${targetFile}`);
    return;
  }

  console.log(`   Source: ${sourceFile}`);
  console.log(`   Target: ${targetFile}`);
  console.log("");

  try {
    const sourceBuffer = fs.readFileSync(sourceFile);
    const targetBuffer = fs.readFileSync(targetFile);

    const formData = new FormData();
    formData.append("sourceImage", new Blob([sourceBuffer], { type: "image/jpeg" }), "source.jpg");
    formData.append("targetImage", new Blob([targetBuffer], { type: "image/jpeg" }), "target.jpg");

    const res = await fetch(`${BASE_URL}/api/swap`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    console.log(`   Status: ${res.status}`);
    console.log(`   ${JSON.stringify(data, null, 2)}`);

    if (data.success && data.result?.outputPath) {
      console.log("");
      console.log(`   ✅ Face swap succeeded!`);
      console.log(`   Output URL: ${data.result.outputPath}`);
      console.log(`   Prediction ID: ${data.result.predictionId}`);
      console.log(`   Attempt: ${data.result.attempt}`);
    } else {
      console.log("");
      console.log(`   ❌ Face swap failed!`);
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
  }
  console.log("");
}

/**
 * Run all integration tests sequentially
 *
 * Executes test suite in order:
 * 1. testHealth() - Basic connectivity check
 * 2. testStatus() - Server and client state verification
 * 3. testFaceSwap() - Full end-to-end workflow
 *
 * Each test is independent and logs results to console.
 * Errors in individual tests do not stop subsequent tests.
 *
 * @async
 * @function runTests
 * @returns {Promise<void>}
 * @throws {Error} Uncaught errors exit process with error code
 *
 * Output Format:
 * - ✅ = Test passed
 * - ❌ = Test failed
 * - Formatted JSON responses from endpoints
 */
async function runTests() {
  console.log("========================================");
  console.log("Face Swap API Integration Tests");
  console.log("========================================");
  console.log("");

  await testHealth();
  await testStatus();
  await testFaceSwap();

  console.log("========================================");
}

// Execute test suite
runTests().catch(console.error);
