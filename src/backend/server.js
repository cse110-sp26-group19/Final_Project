/**
 * memebro Express API server
 *
 * Serves the static frontend and exposes /api/face-swap, which proxies
 * requests to the Replicate face-swap model. The REPLICATE_API_TOKEN never
 * leaves this process — the browser only talks to localhost.
 *
 * Endpoints
 *   POST /api/face-swap  { faceDataUrl, templateUrl } → { outputUrl }
 *   GET  /images/:file   serve generated swap images
 *   GET  /*              serve frontend static files
 */

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import dotenv from "dotenv";
import ReplicateClient from "./replicate-client.js";

dotenv.config({
  path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../../.env"),
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const FRONTEND_DIR = path.join(__dirname, "../frontend");
const GENERATED_DIR = path.join(__dirname, "../frontend/assets/generated");

// Allowed MIME types for face images — HEIC is excluded because Replicate
// does not accept it; browsers read it as image/heic which we reject here.
const ALLOWED_FACE_MIME = /^data:image\/(jpeg|png|webp);base64,/;

// Allowed template URL hosts — restricts SSRF to known CDN origins.
const ALLOWED_TEMPLATE_HOSTS = ["i.imgflip.com", "imgflip.com"];

const app = express();

// Restrict CORS to same-machine origins only (localhost with any port).
// Production deployments should replace this with an explicit origin list.
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS: origin not allowed"));
      }
    },
  })
);

// Accept JSON bodies up to 10 MB to accommodate base64-encoded face images.
app.use(express.json({ limit: "10mb" }));

// Serve generated swap images under /images so the client can display them.
app.use("/images", express.static(GENERATED_DIR));

// Serve the frontend (index.html, pages/, scripts/, styles/, assets/).
app.use(express.static(FRONTEND_DIR));

// Lazy-init so the server starts without a token in pure frontend dev mode.
let _client = null;

function getClient() {
  if (!_client) {
    _client = new ReplicateClient({ outputDir: GENERATED_DIR });
  }
  return _client;
}

/**
 * Fetch a remote image and return it as a base64 data URL.
 * Only fetches from ALLOWED_TEMPLATE_HOSTS to prevent SSRF.
 *
 * @param {string} url
 * @returns {Promise<string>} data URL
 */
async function fetchAsDataUrl(url) {
  const { hostname } = new URL(url);
  if (!ALLOWED_TEMPLATE_HOSTS.includes(hostname)) {
    throw new Error(`Template host not allowed: ${hostname}`);
  }
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 30_000,
  });
  const mimeType = response.headers["content-type"] || "image/jpeg";
  const base64 = Buffer.from(response.data).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

/**
 * POST /api/face-swap
 *
 * Expects JSON body:
 *   faceDataUrl  — base64 data URL of the user's uploaded face photo
 *   templateUrl  — Imgflip CDN URL of the selected meme template
 *
 * Returns JSON:
 *   { outputUrl }  on success
 *   { error }      on failure
 *
 * Security notes:
 *   - API token never leaves this process
 *   - faceDataUrl MIME is validated before forwarding to Replicate
 *   - templateUrl host is restricted to ALLOWED_TEMPLATE_HOSTS (SSRF guard)
 */
app.post("/api/face-swap", async (req, res) => {
  const { faceDataUrl, templateUrl } = req.body ?? {};

  if (!faceDataUrl || !ALLOWED_FACE_MIME.test(faceDataUrl)) {
    return res.status(400).json({
      error: "faceDataUrl must be a base64 data URL (JPEG, PNG, or WebP).",
    });
  }

  if (!templateUrl || !/^https?:\/\/.+/.test(templateUrl)) {
    return res.status(400).json({ error: "templateUrl must be a valid HTTP(S) URL." });
  }

  try {
    const templateDataUrl = await fetchAsDataUrl(templateUrl);

    const client = getClient();

    // Use the lower-level methods directly — generateSwap() requires file
    // paths on disk, but we already have data URLs here.
    const predictionId = await client.createPrediction(faceDataUrl, templateDataUrl);
    console.log(`[face-swap] prediction started: ${predictionId}`);

    const prediction = await client.pollPrediction(predictionId);

    if (prediction.status !== "succeeded") {
      return res
        .status(500)
        .json({ error: `Replicate prediction ended with status: ${prediction.status}` });
    }

    const fileName = await client.downloadAndSaveImage(prediction.output);
    const outputUrl = `http://localhost:${PORT}/images/${fileName}`;

    console.log(`[face-swap] done: ${outputUrl}`);
    return res.json({ outputUrl });
  } catch (error) {
    console.error("[face-swap] error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`memebro server → http://localhost:${PORT}`);
});
