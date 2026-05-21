import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";
import ReplicateClient from "./replicate-client.js";

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../../../../.env") });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
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

// Initialize Replicate client
const replicateClient = new ReplicateClient({
  outputDir: path.join(__dirname, "../../frontend/assets/generated"),
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Face swap API server is running" });
});

/**
 * POST /api/swap
 * Performs face swap between source and target images
 * @param {File} sourceImage - Source image file (the face to swap from)
 * @param {File} targetImage - Target image file (the face to swap to)
 * @returns {Object} Result with output image path and metadata
 */
app.post("/api/swap", upload.fields([{ name: "sourceImage" }, { name: "targetImage" }]), async (req, res) => {
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
});

/**
 * GET /api/status
 * Returns server and Replicate client status
 */
app.get("/api/status", (req, res) => {
  res.json({
    server: "running",
    replicateClient: replicateClient.initialized ? "initialized" : "not initialized",
    service: "Replicate",
    outputDir: replicateClient.outputDir,
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
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

// Start server
app.listen(PORT, () => {
  console.log(`Face swap API server listening on port ${PORT}`);
  console.log(`Health check: GET http://localhost:${PORT}/health`);
  console.log(`Face swap endpoint: POST http://localhost:${PORT}/api/swap`);
  console.log(`Status endpoint: GET http://localhost:${PORT}/api/status`);
});

export default app;
