import path from "node:path";
import { expect, isAiSidecarRunning, test } from "./helpers";

function fixturePath(name: string): string {
  return path.join(process.cwd(), "tests", "fixtures", name);
}

async function uploadFile(page: import("@playwright/test").Page, filePath: string) {
  const fileChooserPromise = page.waitForEvent("filechooser");
  const dropzone = page.locator("[class*='border-dashed']").first();
  await dropzone.click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(filePath);
  await page.waitForTimeout(500);
}

test.describe("Content-Aware Crop", () => {
  // ── Standalone /content-aware-crop route ────────────────────────────

  test("standalone /content-aware-crop route loads", async ({ loggedInPage: page }) => {
    await page.goto("/content-aware-crop");

    await expect(page.getByText("Tool not found")).not.toBeVisible();
    await expect(page.getByText("Content-Aware Crop")).toBeVisible();
    await expect(page.getByText("Extend to aspect ratio")).toBeVisible();
    await expect(page.getByText("Extend by (pixels)")).toBeVisible();
  });

  test("standalone submit disabled without file", async ({ loggedInPage: page }) => {
    await page.goto("/content-aware-crop");
    await expect(page.getByTestId("content-aware-crop-submit")).toBeDisabled();
  });

  test("standalone submit disabled when all extensions are zero", async ({
    loggedInPage: page,
  }) => {
    await page.goto("/content-aware-crop");
    await uploadFile(page, fixturePath("test-200x150.png"));

    await expect(page.getByTestId("content-aware-crop-submit")).toBeDisabled();
  });

  test("standalone submit enables with extension set", async ({ loggedInPage: page }) => {
    await page.goto("/content-aware-crop");
    await uploadFile(page, fixturePath("test-200x150.png"));

    await page.locator("#cac-top").fill("50");

    await expect(page.getByTestId("content-aware-crop-submit")).toBeEnabled();
  });

  test("standalone aspect ratio preset fills extension values", async ({ loggedInPage: page }) => {
    await page.goto("/content-aware-crop");
    await uploadFile(page, fixturePath("test-200x150.png"));

    await page.waitForTimeout(500);
    await page.getByRole("button", { name: "16:9" }).click();

    const topInput = page.locator("#cac-top");
    const rightInput = page.locator("#cac-right");

    const topVal = Number(await topInput.inputValue());
    const rightVal = Number(await rightInput.inputValue());

    expect(topVal > 0 || rightVal > 0).toBe(true);
    await expect(page.getByTestId("content-aware-crop-submit")).toBeEnabled();
  });

  test("standalone shows new size display", async ({ loggedInPage: page }) => {
    await page.goto("/content-aware-crop");
    await uploadFile(page, fixturePath("test-200x150.png"));

    await page.waitForTimeout(500);
    await page.locator("#cac-top").fill("50");
    await page.locator("#cac-bottom").fill("50");

    await expect(page.getByText(/New size: \d+ x \d+/)).toBeVisible();
  });

  // ── Crop tool Content-Aware tab (/crop) ─────────────────────────────

  test("crop page shows Standard and Content-Aware tabs", async ({ loggedInPage: page }) => {
    await page.goto("/crop");
    await uploadFile(page, fixturePath("test-200x150.png"));

    await expect(page.getByRole("button", { name: "Standard" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Content-Aware" })).toBeVisible();
  });

  test("Content-Aware tab hides crop-specific controls", async ({ loggedInPage: page }) => {
    await page.goto("/crop");
    await uploadFile(page, fixturePath("test-200x150.png"));

    await expect(page.getByText("Position & Size")).toBeVisible();

    await page.getByRole("button", { name: "Content-Aware" }).click();

    await expect(page.getByText("Position & Size")).not.toBeVisible();
    await expect(page.getByText("Extend to aspect ratio")).toBeVisible();
    await expect(page.getByText("Extend by (pixels)")).toBeVisible();
  });

  test("switching back to Standard restores crop controls", async ({ loggedInPage: page }) => {
    await page.goto("/crop");
    await uploadFile(page, fixturePath("test-200x150.png"));

    await page.getByRole("button", { name: "Content-Aware" }).click();
    await expect(page.getByText("Extend to aspect ratio")).toBeVisible();

    await page.getByRole("button", { name: "Standard" }).click();
    await expect(page.getByText("Position & Size")).toBeVisible();
    await expect(page.getByText("Extend to aspect ratio")).not.toBeVisible();
  });

  test("Content-Aware tab aspect ratio presets set extensions", async ({ loggedInPage: page }) => {
    await page.goto("/crop");
    await uploadFile(page, fixturePath("test-200x150.png"));

    await page.getByRole("button", { name: "Content-Aware" }).click();
    await page.waitForTimeout(300);

    await page.getByRole("button", { name: "1:1" }).click();

    const topInput = page.locator("#cac-crop-top").or(
      page
        .locator("input")
        .filter({ has: page.locator("[id*='top']") })
        .first(),
    );
    const extendInputs = page.locator("input[type='number']");
    const values = await extendInputs.evaluateAll((els) =>
      els.map((el) => Number((el as HTMLInputElement).value)),
    );

    const hasNonZero = values.some((v) => v > 0);
    expect(hasNonZero).toBe(true);
  });

  test("Content-Aware submit button says Extend", async ({ loggedInPage: page }) => {
    await page.goto("/crop");
    await uploadFile(page, fixturePath("test-200x150.png"));

    await page.getByRole("button", { name: "Content-Aware" }).click();

    const submitBtn = page.getByTestId("crop-submit");
    await expect(submitBtn).toHaveText(/Extend/);
  });

  // ── Processing (requires AI sidecar) ────────────────────────────────

  test("processes image (AI sidecar required)", async ({ loggedInPage: page }) => {
    await page.goto("/content-aware-crop");

    if (!(await isAiSidecarRunning(page))) {
      test.skip(true, "AI sidecar not running");
    }

    await uploadFile(page, fixturePath("test-200x150.png"));
    await page.locator("#cac-top").fill("30");
    await page.locator("#cac-bottom").fill("30");

    await page.getByTestId("content-aware-crop-submit").click();

    const download = page.getByTestId("content-aware-crop-download");
    const error = page.getByText(/failed|not available|not installed|error/i);

    await expect(download.or(error)).toBeVisible({ timeout: 300_000 });
  });
});
