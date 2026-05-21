import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config({
  path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../../../../.env"),
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class ReplicateClient {
  constructor(config = {}) {
    this.apiToken = config.apiToken || process.env.REPLICATE_API_TOKEN;
    this.modelId =
      config.modelId ||
      "codeplugtech/face-swap:278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34";
    this.apiBase = "https://api.replicate.com/v1";
    this.timeout = config.timeout || 300000;
    this.maxRetries = config.maxRetries || 1;
    this.outputDir = config.outputDir || path.join(__dirname, "../../frontend/assets/generated");
    this.pollInterval = config.pollInterval || 500;
    this.initialized = false;

    if (!this.apiToken) {
      throw new Error("REPLICATE_API_TOKEN is required in .env file");
    }

    this.initializeOutputDir();
  }

  initializeOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    this.initialized = true;
  }

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

        const outputPath = await this.downloadAndSaveImage(result.output, options.outputName);

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
        throw new Error("Invalid API token - check .env");
      }
      if (error.response?.status === 402) {
        throw new Error("Insufficient credits - add payment at https://replicate.com");
      }
      if (error.response?.status === 404) {
        throw new Error("Model not found - check model ID");
      }
      if (error.response?.status === 422) {
        throw new Error(`Invalid format: ${JSON.stringify(error.response.data)}`);
      }
      if (error.response?.status === 429) {
        throw new Error("Rate limited - try again later");
      }
      throw new Error(`API error: ${error.response?.status || error.code} - ${error.message}`);
    }
  }

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
        throw new Error(`Poll failed: ${error.message}`);
      }
    }

    throw new Error("Polling timeout exceeded");
  }

  async downloadAndSaveImage(imageUrl, outputName) {
    try {
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 60000,
      });

      const fileName = outputName || `swapped_${Date.now()}.png`;
      const outputPath = path.join(this.outputDir, fileName);

      fs.writeFileSync(outputPath, response.data);
      return outputPath;
    } catch (error) {
      throw new Error(`Download failed: ${error.message}`);
    }
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default ReplicateClient;
