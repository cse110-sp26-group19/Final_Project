/**
 * E2E: Full user journey from home to result
 *
 * Smoke test that walks: home → templates → edit → result
 * Catches regressions in routing, sessionStorage hand-off, and page wiring.
 *
 * Requires the frontend to be served locally (handled by jest-puppeteer.config.cjs).
 * Does NOT depend on the live AI face-swap backend — runs against the
 * plain-template fallback path only.
 *
 * Run with: npm run test:e2e
 */

const BASE_URL = "http://localhost:3000";

/**
 * Minimal 1×1 white PNG as a data URL — used as a stand-in for a real face
 * photo so guardPage("edit") passes without needing a real file upload.
 */
const STUB_FACE_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==";

/**
 * Seed the three flow sessionStorage keys so guarded pages render instead of
 * redirecting. Call this after navigating to any page on the same origin.
 */
async function seedFlowState(templateId = "1") {
  await page.evaluate(
    ({ templateId, faceDataUrl }) => {
      sessionStorage.setItem("memebro:selected-template", templateId);
      sessionStorage.setItem("memebro:face-photo", faceDataUrl);
      sessionStorage.setItem(
        "memebro:current-meme",
        JSON.stringify({
          templateUrl: "https://i.imgflip.com/1bij.jpg",
          templateName: "One Does Not Simply",
          textBoxes: [{ text: "top text", x: 0.5, y: 0.1 }],
          swappedUrl: null,
        })
      );
    },
    { templateId, faceDataUrl: STUB_FACE_DATA_URL }
  );
}

describe("Full user journey: home → templates → edit → result", () => {
  // ---------------------------------------------------------------------------
  // Step 1: Home page loads and Browse link is present
  // ---------------------------------------------------------------------------
  test("home page loads and shows Browse Templates link", async () => {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: "domcontentloaded" });

    const browseLink = await page.$('a[href="./pages/templates.html"]');
    expect(browseLink).not.toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Step 2: Clicking Browse navigates to templates page
  // ---------------------------------------------------------------------------
  test("clicking Browse navigates to templates.html", async () => {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: "domcontentloaded" });

    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      page.click('a[href="./pages/templates.html"]'),
    ]);

    expect(page.url()).toContain("templates.html");
  });

  // ---------------------------------------------------------------------------
  // Step 3: Template grid populates with at least one card
  // ---------------------------------------------------------------------------
  test("template grid shows at least one template card", async () => {
    await page.goto(`${BASE_URL}/pages/templates.html`, { waitUntil: "domcontentloaded" });

    await page.waitForSelector(".template-grid .template-card", { timeout: 15000 });

    const cards = await page.$$(".template-grid .template-card");
    expect(cards.length).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // Step 4: Clicking a template card stores the template id in sessionStorage
  // ---------------------------------------------------------------------------
  test("clicking a template card stores the template in sessionStorage", async () => {
    await page.goto(`${BASE_URL}/pages/templates.html`, { waitUntil: "domcontentloaded" });

    await page.waitForSelector(".template-grid .template-card", { timeout: 15000 });

    await page.click(".template-grid .template-card");

    await new Promise((r) => setTimeout(r, 300));

    const stored = await page.evaluate(() => sessionStorage.getItem("memebro:selected-template"));

    expect(stored).not.toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Step 5: Edit page renders a canvas when flow prerequisites are met
  // ---------------------------------------------------------------------------
  test("edit page renders a canvas when template and photo are in sessionStorage", async () => {
    // Click a real card so the actual Imgflip template ID lands in sessionStorage
    await page.goto(`${BASE_URL}/pages/templates.html`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".template-grid .template-card", { timeout: 15000 });
    await page.click(".template-grid .template-card");
    await new Promise((r) => setTimeout(r, 300));

    // Add the face photo so guardPage("edit") passes
    await page.evaluate((faceDataUrl) => {
      sessionStorage.setItem("memebro:face-photo", faceDataUrl);
    }, STUB_FACE_DATA_URL);

    await page.goto(`${BASE_URL}/pages/edit.html`, { waitUntil: "domcontentloaded" });

    await page.waitForSelector("#preview-canvas", { timeout: 10000 }).catch(() => {});

    const canvas = await page.$("#preview-canvas");
    expect(canvas).not.toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Step 6: Generate button navigates to result.html
  // ---------------------------------------------------------------------------
  test("clicking Generate navigates to result.html", async () => {
    // Click a real template card so the real Imgflip template ID is stored in sessionStorage
    await page.goto(`${BASE_URL}/pages/templates.html`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".template-grid .template-card", { timeout: 15000 });
    await page.click(".template-grid .template-card");
    await new Promise((r) => setTimeout(r, 300));

    // Seed the face photo (edit.js requires it to proceed)
    await page.evaluate((faceDataUrl) => {
      sessionStorage.setItem("memebro:face-photo", faceDataUrl);
    }, STUB_FACE_DATA_URL);

    // Now navigate to edit — real template ID + face photo both present
    await page.goto(`${BASE_URL}/pages/edit.html`, { waitUntil: "domcontentloaded" });

    // Wait for the generate button to become enabled (edit.js enables it after the template loads)
    await page.waitForSelector("#generate-btn:not([disabled])", { timeout: 10000 });

    // Intercept the face-swap API call and return an immediate error so generate() catches
    // it and navigates to result.html without waiting for a live Replicate response.
    // This makes the test pass cross-platform regardless of whether a token is present.
    await page.setRequestInterception(true);
    const abortFaceSwap = (req) => {
      if (req.url().includes("/api/face-swap")) {
        req.respond({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ error: "face-swap mocked in E2E test" }),
        });
      } else {
        req.continue();
      }
    };
    page.on("request", abortFaceSwap);

    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }),
      page.click("#generate-btn"),
    ]);

    // Clean up request interception
    page.off("request", abortFaceSwap);
    await page.setRequestInterception(false);

    expect(page.url()).toContain("result.html");
  });

  // ---------------------------------------------------------------------------
  // Step 7: Result page has a canvas and Make another link when meme spec exists
  // ---------------------------------------------------------------------------
  test("result page has canvas and Make another link when meme spec is in sessionStorage", async () => {
    // Seed sessionStorage on a non-guarded page first — navigating directly to
    // result.html without the spec causes an immediate redirect before evaluate() runs.
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: "domcontentloaded" });
    await seedFlowState();

    // Now navigate — hasMeme is already true so guardPage("result") passes
    await page.goto(`${BASE_URL}/pages/result.html`, { waitUntil: "domcontentloaded" });

    const canvas = await page.$("#result-canvas");
    expect(canvas).not.toBeNull();

    const restartLink = await page.$("#restart-btn");
    expect(restartLink).not.toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Step 8: Make another link returns to home
  // ---------------------------------------------------------------------------
  test("clicking Make another returns to index.html", async () => {
    // Same pattern: seed on index.html first, then navigate to result.html
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: "domcontentloaded" });
    await seedFlowState();

    await page.goto(`${BASE_URL}/pages/result.html`, { waitUntil: "domcontentloaded" });

    await page.waitForSelector("#restart-btn", { timeout: 5000 });

    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      page.click("#restart-btn"),
    ]);

    expect(page.url()).toContain("index.html");
  });
});
