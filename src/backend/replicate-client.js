import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config({
  path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../../../.env"),
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Replicate face-swap API client
 * Handles complete workflow: images → base64 → prediction → poll → download → HTTP URL
 */
class ReplicateClient {
  /**
   * @param {Object} config Configuration object
   * @param {string} config.apiToken Replicate API token (defaults to REPLICATE_API_TOKEN env var)
   * @param {string} config.modelId Face swap model ID with version hash
   * @param {string} config.outputDir Directory to save swapped images
   * @param {number} config.timeout Max time to wait for prediction in ms (default: 300000)
   * @param {number} config.maxRetries Number of retry attempts (default: 1)
   * @param {number} config.pollInterval Time between status checks in ms (default: 500)
   */
  constructor(config = {}) {
    this.apiToken = config.apiToken || process.env.REPLICATE_API_TOKEN;
    this.modelId =
      config.modelId ||
      "codeplugtech/face-swap:278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34";
    this.apiBase = "https://api.replicate.com/v1";
    this.timeout = config.timeout || 300000;
    this.maxRetries = config.maxRetries || 1;
    this.outputDir = config.outputDir || path.join(__dirname, "../frontend/assets/generated");
    this.pollInterval = config.pollInterval || 500;

    if (!this.apiToken) {
      throw new Error("REPLICATE_API_TOKEN is required in .env file");
    }
    this.initializeOutputDir();
  }

  /**
   * Create output directory if it doesn't exist
   */
  initializeOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Convert image file to base64 data URL format required by Replicate API
   * @param {string} filePath Path to image file on disk
   * @returns {Promise<string>} Base64 data URL (e.g., "data:image/jpeg;base64,...")
   */
  async fileToDataUrl(filePath) {
    const imageBuffer = fs.readFileSync(filePath);
    const base64 = imageBuffer.toString("base64");
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const mimeType =
      {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
      }[ext] || "image/jpeg";
    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * Perform face swap between source and target images
   * Converts images → creates prediction → polls result → downloads → returns HTTP URL
   * @param {string} sourceImagePath Path to source face image file
   * @param {string} targetImagePath Path to target face region to swap
   * @param {Object} options Additional options for swap
   * @param {string} options.outputName Custom output filename (default: swapped_<timestamp>.png)
   * @returns {Promise<Object>} Result object
   * @returns {boolean} result.success True if swap succeeded
   * @returns {string} result.outputPath HTTP URL to swapped image
   * @returns {string} result.timestamp ISO timestamp of completion
   * @returns {string} result.predictionId Replicate prediction ID for tracking
   * @returns {number} result.attempt Which attempt succeeded (1 to maxRetries)
   * @throws {Error} If all retry attempts fail
   */
  async generateSwap(sourceImagePath, targetImagePath, options = {}) {
    const maxAttempts = this.maxRetries;
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (!fs.existsSync(sourceImagePath)) {
          throw new Error(`Source image not found: ${sourceImagePath}`);
        }
        if (!fs.existsSync(targetImagePath)) {
          throw new Error(`Target image not found: ${targetImagePath}`);
        }

        console.log(`[Attempt ${attempt}/${maxAttempts}] Starting face swap...`);

        const sourceUrl = await this.fileToDataUrl(sourceImagePath);
        const targetUrl = await this.fileToDataUrl(targetImagePath);

        const predictionId = await this.createPrediction(sourceUrl, targetUrl);
        console.log(`Prediction created: ${predictionId}`);

        const result = await this.pollPrediction(predictionId);

        if (result.status !== "succeeded") {
          throw new Error(`Prediction failed with status: ${result.status}`);
        }

        const fileName = await this.downloadAndSaveImage(result.output, options.outputName);
        const outputPath = `http://localhost:3001/images/${fileName}`;

        return {
          success: true,
          outputPath,
          timestamp: new Date().toISOString(),
          predictionId,
          attempt,
        };
      } catch (error) {
        lastError = error;
        console.warn(`Swap attempt ${attempt}/${maxAttempts} failed:`, error.message);

        if (attempt < maxAttempts) {
          await this.delay(2000 * attempt);
        }
      }
    }

    throw new Error(`Face swap failed after ${maxAttempts} attempts: ${lastError.message}`);
  }

  /**
   * Create prediction job on Replicate API
   * Sends swap request and initiates processing
   * @param {string} sourceUrl Base64 source face image data URL
   * @param {string} targetUrl Base64 target face region data URL
   * @returns {Promise<string>} Prediction ID to track the job status
   * @throws {Error} On auth errors (401), insufficient credits (402), invalid format (422), rate limiting (429), etc.
   */
  async createPrediction(sourceUrl, targetUrl) {
    try {
      const versionId = this.modelId.includes(":") ? this.modelId.split(":")[1] : this.modelId;
      const payload = {
        version: versionId,
        input: {
          input_image: targetUrl,
          swap_image: sourceUrl,
        },
      };

      const response = await axios.post(`${this.apiBase}/predictions`, payload, {
        headers: {
          Authorization: `Token ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        timeout: this.timeout,
      });

      return response.data.id;
    } catch (error) {
      console.error("API Error:", error.response?.data);

      if (error.response?.status === 401) {
        throw new Error("Invalid API token - check .env", { cause: error });
      }
      if (error.response?.status === 402) {
        throw new Error("Insufficient credits - add payment at https://replicate.com", {
          cause: error,
        });
      }
      if (error.response?.status === 404) {
        throw new Error("Model not found - check model ID", { cause: error });
      }
      if (error.response?.status === 422) {
        throw new Error(`Invalid format: ${JSON.stringify(error.response.data)}`, {
          cause: error,
        });
      }
      if (error.response?.status === 429) {
        throw new Error("Rate limited - try again later", { cause: error });
      }

      throw new Error(`API error: ${error.response?.status || error.code} - ${error.message}`, {
        cause: error,
      });
    }
  }

  /**
   * Poll Replicate API until prediction reaches terminal state
   * Checks status every pollInterval ms until completion or timeout
   * @param {string} predictionId ID of prediction to monitor
   * @returns {Promise<Object>} Final prediction object with status, output, and metadata
   * @throws {Error} If prediction fails or polling times out
   */
  async pollPrediction(predictionId) {
    const startTime = Date.now();

    while (Date.now() - startTime < this.timeout) {
      try {
        const response = await axios.get(`${this.apiBase}/predictions/${predictionId}`, {
          headers: {
            Authorization: `Token ${this.apiToken}`,
          },
          timeout: 30000,
        });

        const prediction = response.data;

        if (
          prediction.status === "succeeded" ||
          prediction.status === "failed" ||
          prediction.status === "canceled"
        ) {
          return prediction;
        }

        console.log(`Status: ${prediction.status}`);
        await this.delay(this.pollInterval);
      } catch (error) {
        throw new Error(`Poll failed: ${error.message}`, { cause: error });
      }
    }

    throw new Error("Polling timeout exceeded");
  }

  /**
   * Download swapped image from Replicate and save to local disk
   * Returns filename only (not full path) for HTTP URL construction in generateSwap()
   * @param {string} imageUrl URL to swapped image on Replicate servers
   * @param {string} outputName Optional custom filename (if not provided, uses swapped_<timestamp>.png)
   * @returns {Promise<string>} Filename only (e.g., "swapped_1634567890123.png") - NOT full path
   * @throws {Error} If download or file save fails
   */
  async downloadAndSaveImage(imageUrl, outputName) {
    try {
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 60000,
      });

      const fileName = outputName || `swapped_${Date.now()}.png`;
      const outputPath = path.join(this.outputDir, fileName);

      fs.writeFileSync(outputPath, response.data);
      return fileName;
    } catch (error) {
      throw new Error(`Download failed: ${error.message}`, { cause: error });
    }
  }

  /**
   * Delay execution for specified milliseconds
   * @param {number} ms Milliseconds to sleep
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default ReplicateClient;
