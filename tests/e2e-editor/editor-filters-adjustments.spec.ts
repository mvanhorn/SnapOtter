import { createNewDocument, drawOnCanvas, expect, selectTool, test } from "./helpers";

test.describe("Editor Filters and Adjustments", () => {
  test.beforeEach(async ({ editorPage: page }) => {
    await createNewDocument(page);
    // Switch to adjustments tab
    await page.locator("[data-testid='tab-adjustments']").click();
    await page.waitForTimeout(300);
  });

  test("adjustments panel is visible and has sliders", async ({ editorPage: page }) => {
    // The adjustments section header should be visible
    await expect(page.getByText("Adjustments", { exact: true }).first()).toBeVisible();

    // Check that core slider labels are present
    await expect(page.getByText("Brightness").first()).toBeVisible();
    await expect(page.getByText("Contrast").first()).toBeVisible();
    await expect(page.getByText("Saturation").first()).toBeVisible();
  });

  test("brightness slider changes canvas visually", async ({ editorPage: page }) => {
    test.slow();

    // Draw something on canvas so there are pixels to adjust
    await selectTool(page, "brush");
    await drawOnCanvas(page, 100, 100, 300, 300);

    // Re-select adjustments tab
    await page.locator("[data-testid='tab-adjustments']").click();
    await page.waitForTimeout(300);

    const canvas = page.locator("canvas").first();
    const before = await canvas.screenshot();

    // Find the Brightness slider row and change its value
    const brightnessNumber = page
      .locator(".flex.items-center.gap-2")
      .filter({ hasText: "Brightness" })
      .locator("input[type='number']");
    await brightnessNumber.fill("50");
    await brightnessNumber.press("Enter");
    await page.waitForTimeout(500);

    const after = await canvas.screenshot();
    expect(Buffer.compare(before, after)).not.toBe(0);
  });

  test("exposure slider changes canvas visually", async ({ editorPage: page }) => {
    test.slow();

    await selectTool(page, "brush");
    await drawOnCanvas(page, 100, 100, 300, 300);

    await page.locator("[data-testid='tab-adjustments']").click();
    await page.waitForTimeout(300);

    const canvas = page.locator("canvas").first();
    const before = await canvas.screenshot();

    const exposureNumber = page
      .locator(".flex.items-center.gap-2")
      .filter({ hasText: "Exposure" })
      .locator("input[type='number']");
    await exposureNumber.fill("50");
    await exposureNumber.press("Enter");
    await page.waitForTimeout(500);

    const after = await canvas.screenshot();
    expect(Buffer.compare(before, after)).not.toBe(0);
  });

  test("vibrance slider changes canvas visually", async ({ editorPage: page }) => {
    test.slow();

    await selectTool(page, "brush");
    await drawOnCanvas(page, 100, 100, 300, 300);

    await page.locator("[data-testid='tab-adjustments']").click();
    await page.waitForTimeout(300);

    const canvas = page.locator("canvas").first();
    const before = await canvas.screenshot();

    const vibranceNumber = page
      .locator(".flex.items-center.gap-2")
      .filter({ hasText: "Vibrance" })
      .locator("input[type='number']");
    await vibranceNumber.fill("60");
    await vibranceNumber.press("Enter");
    await page.waitForTimeout(500);

    const after = await canvas.screenshot();
    expect(Buffer.compare(before, after)).not.toBe(0);
  });

  test("warmth slider changes canvas visually", async ({ editorPage: page }) => {
    test.slow();

    await selectTool(page, "brush");
    await drawOnCanvas(page, 100, 100, 300, 300);

    await page.locator("[data-testid='tab-adjustments']").click();
    await page.waitForTimeout(300);

    const canvas = page.locator("canvas").first();
    const before = await canvas.screenshot();

    const warmthNumber = page
      .locator(".flex.items-center.gap-2")
      .filter({ hasText: "Warmth" })
      .locator("input[type='number']");
    await warmthNumber.fill("40");
    await warmthNumber.press("Enter");
    await page.waitForTimeout(500);

    const after = await canvas.screenshot();
    expect(Buffer.compare(before, after)).not.toBe(0);
  });

  test("filter toggle (blur) changes canvas", async ({ editorPage: page }) => {
    test.slow();

    await selectTool(page, "brush");
    await drawOnCanvas(page, 100, 100, 300, 300);

    await page.locator("[data-testid='tab-adjustments']").click();
    await page.waitForTimeout(300);

    const canvas = page.locator("canvas").first();
    const before = await canvas.screenshot();

    // Scroll to the Filters section and enable Blur
    const blurCheckbox = page
      .locator("label")
      .filter({ hasText: /^Blur$/ })
      .locator("input[type='checkbox']");
    await blurCheckbox.scrollIntoViewIfNeeded();
    await blurCheckbox.check();
    await page.waitForTimeout(500);

    const after = await canvas.screenshot();
    expect(Buffer.compare(before, after)).not.toBe(0);
  });

  test("filter toggle (sharpen) changes canvas", async ({ editorPage: page }) => {
    test.slow();

    await selectTool(page, "brush");
    await drawOnCanvas(page, 100, 100, 300, 300);

    await page.locator("[data-testid='tab-adjustments']").click();
    await page.waitForTimeout(300);

    const canvas = page.locator("canvas").first();
    const before = await canvas.screenshot();

    const sharpenCheckbox = page
      .locator("label")
      .filter({ hasText: /^Sharpen$/ })
      .locator("input[type='checkbox']");
    await sharpenCheckbox.scrollIntoViewIfNeeded();
    await sharpenCheckbox.check();
    await page.waitForTimeout(500);

    const after = await canvas.screenshot();
    expect(Buffer.compare(before, after)).not.toBe(0);
  });

  test("filter toggle (vignette) changes canvas", async ({ editorPage: page }) => {
    test.slow();

    await selectTool(page, "brush");
    await drawOnCanvas(page, 100, 100, 300, 300);

    await page.locator("[data-testid='tab-adjustments']").click();
    await page.waitForTimeout(300);

    const canvas = page.locator("canvas").first();
    const before = await canvas.screenshot();

    // Scroll to the Effects section and enable Vignette
    const vignetteCheckbox = page
      .locator("label")
      .filter({ hasText: /^Vignette$/ })
      .locator("input[type='checkbox']");
    await vignetteCheckbox.scrollIntoViewIfNeeded();
    await vignetteCheckbox.check();
    await page.waitForTimeout(500);

    const after = await canvas.screenshot();
    expect(Buffer.compare(before, after)).not.toBe(0);
  });

  test("filter toggle (grain) changes canvas", async ({ editorPage: page }) => {
    test.slow();

    await selectTool(page, "brush");
    await drawOnCanvas(page, 100, 100, 300, 300);

    await page.locator("[data-testid='tab-adjustments']").click();
    await page.waitForTimeout(300);

    const canvas = page.locator("canvas").first();
    const before = await canvas.screenshot();

    const grainCheckbox = page
      .locator("label")
      .filter({ hasText: /^Grain$/ })
      .locator("input[type='checkbox']");
    await grainCheckbox.scrollIntoViewIfNeeded();
    await grainCheckbox.check();
    await page.waitForTimeout(500);

    const after = await canvas.screenshot();
    expect(Buffer.compare(before, after)).not.toBe(0);
  });

  test("histogram panel shows data when image is loaded", async ({ editorPage: page }) => {
    test.slow();

    // Draw something so the histogram has pixel data to analyze
    await selectTool(page, "brush");
    await drawOnCanvas(page, 50, 50, 400, 400);

    await page.locator("[data-testid='tab-adjustments']").click();
    await page.waitForTimeout(1000);

    // The histogram canvas element should be rendered
    const histogramCanvas = page.locator("canvas[width='256'][height='80']");
    await expect(histogramCanvas).toBeVisible();
  });

  test("reset button resets all adjustments to zero", async ({ editorPage: page }) => {
    test.slow();

    // Set a non-zero adjustment
    const brightnessNumber = page
      .locator(".flex.items-center.gap-2")
      .filter({ hasText: "Brightness" })
      .locator("input[type='number']");
    await brightnessNumber.fill("50");
    await brightnessNumber.press("Enter");
    await page.waitForTimeout(300);

    // The Reset All button should be enabled
    const resetBtn = page.locator("button").filter({ hasText: "Reset All" });
    await resetBtn.scrollIntoViewIfNeeded();
    await expect(resetBtn).toBeEnabled();

    // Click Reset All
    await resetBtn.click();
    await page.waitForTimeout(300);

    // Brightness should be back to 0
    await expect(brightnessNumber).toHaveValue("0");

    // Reset All button should now be disabled
    await expect(resetBtn).toBeDisabled();
  });
});
