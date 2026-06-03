/**
 * ARCHIVED — temporary local dev backend used only for the Week 8 MVP demo.
 * Kept as a record of the work; NOT used in production and NOT deployed.
 * Superseded by the selected backend (see Week 9 planning / backend ADRs).
 *
 * Proxies a face-swap request to Gemini 2.5 Flash Image (Nano Banana 2).
 * Frontend POSTs { templateUrl, userImage } where userImage is base64 (no
 * data-URL prefix). Server fetches the template, calls Gemini, and returns
 * { image } as base64. Falls back gracefully on any error.
 *
 * Requires the GEMINI_API_KEY environment variable (no key is stored here).
 * Run: node server.js
 */
import http from "node:http";

const PORT = 3001;
const API_KEY = process.env.GEMINI_API_KEY;
// Nano Banana 2 (Gemini 2.5 Flash Image). Swap to a newer model here if Google ships one.
const MODEL = "gemini-2.5-flash-image";

const PROMPT = `Perform a precise face swap between two images.

Image 1 is the meme template. Image 2 is the source face.

Replace the face of the main subject in Image 1 with the face from Image 2. If the meme has multiple visible faces, replace each one with the same source face. If the original face is stylized (cartoon, statue, mascot, character), adapt the user's features to that style — keep the user recognizable but render in the target medium.

For each face replaced: match the original angle, gaze direction, expression, and lighting. Blend seamlessly at the hairline and jawline.

Keep everything else in Image 1 pixel-identical: composition, background, body, pose, clothing, hair, other people's bodies, embedded text, watermarks, and color grading.

Output a single image. No caption text. Never return Image 1 unchanged.`;

if (!API_KEY) {
  console.error("Missing GEMINI_API_KEY environment variable. Export it before starting.");
  process.exit(1);
}

const setCORS = (res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

const json = (res, status, payload) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
};

async function handleGenerate(body) {
  const { templateUrl, userImage } = JSON.parse(body);
  if (!templateUrl || !userImage) {
    throw new Error("templateUrl and userImage are required");
  }

  // Fetch the template image and convert to base64.
  const templateRes = await fetch(templateUrl);
  if (!templateRes.ok) {
    throw new Error(`template fetch failed: ${templateRes.status}`);
  }
  const templateMime = templateRes.headers.get("content-type") || "image/jpeg";
  const templateB64 = Buffer.from(await templateRes.arrayBuffer()).toString("base64");

  // Call Gemini.
  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inlineData: { mimeType: templateMime, data: templateB64 } },
              { inlineData: { mimeType: "image/jpeg", data: userImage } },
              { text: PROMPT },
            ],
          },
        ],
        // Moderately low temperature — conservative enough to honor the preservation
        // constraints, loose enough to handle stylized faces and multi-face templates.
        generationConfig: {
          responseModalities: ["IMAGE"],
          temperature: 0.4,
        },
      }),
    }
  );

  const data = await geminiRes.json();
  if (!geminiRes.ok) {
    throw new Error(`Gemini ${geminiRes.status}: ${JSON.stringify(data)}`);
  }

  const imagePart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!imagePart) {
    throw new Error(`no image in Gemini response: ${JSON.stringify(data)}`);
  }
  return imagePart.inlineData.data;
}

http
  .createServer(async (req, res) => {
    setCORS(res);
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }
    if (req.method !== "POST" || req.url !== "/api/generate") {
      return json(res, 404, { error: "not found" });
    }

    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const image = await handleGenerate(body);
        json(res, 200, { image });
      } catch (err) {
        console.error("generate failed:", err.message);
        json(res, 500, { error: err.message });
      }
    });
  })
  .listen(PORT, () => {
    console.log(`Dev backend running on http://localhost:${PORT}`);
    console.log(`POST /api/generate { templateUrl, userImage (base64) } → { image (base64) }`);
  });
