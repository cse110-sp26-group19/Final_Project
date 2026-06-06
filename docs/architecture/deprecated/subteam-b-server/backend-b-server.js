/**
 * Face Swap API Server
 *
 * Express.js backend for handling face-swap requests via Replicate API.
 * Accepts multipart image uploads, processes them through ReplicateClient,
 * and returns HTTP URLs to swapped images.
 *
 * @module server
 * @requires express
 * @requires multer
 * @requires dotenv
 * @requires ./replicate-client.js
 */

import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";
import ReplicateClient from "./replicate-client.js";

dotenv.config({
  path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../../.env"),
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

/**
 * Configure multer storage for temporary image uploads
 * Creates uploads directory if it doesn't exist
 * @type {multer.StorageEngine}
 */
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

/**
 * Multer middleware configuration for image file uploads
 * @type {multer.Multer}
 *
 * @config {Object} storage - Disk storage configuration
 * @config {Function} fileFilter - Validates MIME types (JPEG, PNG, WebP)
 * @config {Object} limits - File size limit (50MB)
 */
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed."));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

/**
 * Initialize Replicate client for face-swap API integration
 * @type {ReplicateClient}
 */
const replicateClient = new ReplicateClient({
  outputDir: path.join(__dirname, "frontend/assets/generated"),
});

// ============================================================================
// Middleware
// ============================================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * CORS middleware - Enables cross-origin requests from browser clients
 * Allows requests from any origin for development/testing
 * Sets appropriate headers for preflight requests
 * @middleware
 */
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

/**
 * Static file serving middleware
 * Serves generated swap images from frontend/assets/generated directory
 * Images are accessible at http://localhost:3001/images/<filename>
 * @middleware
 */
app.use("/images", express.static(path.join(__dirname, "frontend/assets/generated")));

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /health
 * Health check endpoint for monitoring server status
 *
 * @route {GET} /health
 * @returns {Object} 200 - { status: "ok", message: string }
 */
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Face swap API server is running" });
});

/**
 * POST /api/swap
 * Performs face swap between source and target images
 *
 * @route {POST} /api/swap
 * @middleware upload.fields([{ name: "sourceImage" }, { name: "targetImage" }])
 *
 * @param {File} req.files.sourceImage - Source image file (face to copy from)
 * @param {File} req.files.targetImage - Target image file (region to replace)
 * @param {Object} [req.body.options] - Optional swap configuration
 *
 * @returns {Object} 200 - { success: true, message: string, result: { outputPath, predictionId, attempt, timestamp } }
 * @returns {Object} 400 - { error: string, message: string }
 * @returns {Object} 413 - { error: "File upload error", message: string }
 * @returns {Object} 500 - { success: false, error: string, message: string }
 */
app.post(
  "/api/swap",
  upload.fields([{ name: "sourceImage" }, { name: "targetImage" }]),
  async (req, res) => {
    try {
      // Validate files are uploaded
      if (!req.files || !req.files.sourceImage || !req.files.targetImage) {
        return res.status(400).json({
          error: "Missing required files",
          message: "Both sourceImage and targetImage are required",
        });
      }

      const sourceImagePath = req.files.sourceImage[0].path;
      const targetImagePath = req.files.targetImage[0].path;

      console.log(`Processing face swap...`);
      console.log(`Source: ${sourceImagePath}`);
      console.log(`Target: ${targetImagePath}`);

      // Perform face swap
      const result = await replicateClient.generateSwap(sourceImagePath, targetImagePath, {
        options: req.body.options || {},
      });

      // Clean up uploaded files
      fs.unlink(sourceImagePath, (err) => {
        if (err) console.error(`Failed to delete source: ${err.message}`);
      });
      fs.unlink(targetImagePath, (err) => {
        if (err) console.error(`Failed to delete target: ${err.message}`);
      });

      res.json({
        success: true,
        message: "Face swap completed successfully",
        result: result,
      });
    } catch (error) {
      console.error("Face swap error:", error.message);

      // Clean up files on error
      if (req.files?.sourceImage?.[0]?.path && fs.existsSync(req.files.sourceImage[0].path)) {
        fs.unlink(req.files.sourceImage[0].path, (err) => {
          if (err) console.error(`Failed to delete source: ${err.message}`);
        });
      }
      if (req.files?.targetImage?.[0]?.path && fs.existsSync(req.files.targetImage[0].path)) {
        fs.unlink(req.files.targetImage[0].path, (err) => {
          if (err) console.error(`Failed to delete target: ${err.message}`);
        });
      }

      res.status(500).json({
        success: false,
        error: error.message,
        message: "Failed to process face swap",
      });
    }
  }
);

/**
 * GET /api/status
 * Returns server and Replicate client status
 *
 * @route {GET} /api/status
 * @returns {Object} 200 - { server: "running", replicateClient: string, service: "Replicate", outputDir: string }
 */
app.get("/api/status", (req, res) => {
  res.json({
    server: "running",
    replicateClient: replicateClient.apiToken ? "initialized" : "not initialized",
    service: "Replicate",
    outputDir: replicateClient.outputDir,
  });
});

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Express error handling middleware
 * Catches multer and other errors and returns JSON responses
 *
 * @middleware
 * @param {Error} error - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} _next - Express next middleware (unused)
 *
 * @returns {Object} 400 - { error: "File upload error", message: string }
 * @returns {Object} 500 - { error: "Internal server error", message: string }
 */
app.use((error, req, res, _next) => {
  console.error("Express error:", error.message);
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      error: "File upload error",
      message: error.message,
    });
  }
  res.status(500).json({
    error: "Internal server error",
    message: error.message,
  });
});

// ============================================================================
// Server Startup
// ============================================================================

/**
 * Start the Express server
 * Logs startup information and available endpoints
 *
 * Environment variables:
 * - PORT: Server port (default: 3001)
 * - REPLICATE_API_TOKEN: Required for Replicate API authentication
 */
app.listen(PORT, () => {
  console.log(`Face swap API server listening on port ${PORT}`);
  console.log(`Health check: GET http://localhost:${PORT}/health`);
  console.log(`Face swap endpoint: POST http://localhost:${PORT}/api/swap`);
  console.log(`Status endpoint: GET http://localhost:${PORT}/api/status`);
});

export default app;
