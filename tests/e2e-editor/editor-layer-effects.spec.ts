import { createNewDocument, drawOnCanvas, expect, selectTool, test } from "./helpers";

test.describe("Editor Layer Effects and Blend Modes", () => {
  test.beforeEach(async ({ editorPage: page }) => {
    await createNewDocument(page);
    // Ensure layers tab is active
    await page.locator("[data-testid='tab-layers']").click();
    await page.waitForTimeout(300);
  });

  test("blend mode dropdown exists in layers panel", async ({ editorPage: page }) => {
    const blendSelect = page.locator("[data-testid='blend-mode-select']");
    await expect(blendSelect).toBeVisible();

    // Should default to Normal (source-over)
    await expect(blendSelect).toHaveValue("source-over");
  });

  test("blend mode can be changed", async ({ editorPage: page }) => {
    const blendSelect = page.locator("[data-testid='blend-mode-select']");
    await expect(blendSelect).toBeVisible();

    // Change to Multiply
    await blendSelect.selectOption("multiply");
    await page.waitForTimeout(300);

    await expect(blendSelect).toHaveValue("multiply");

    // Change to Screen
    await blendSelect.selectOption("screen");
    await page.waitForTimeout(300);

    await expect(blendSelect).toHaveValue("screen");

    // Change to Overlay
    await blendSelect.selectOption("overlay");
    await page.waitForTimeout(300);

    await expect(blendSelect).toHaveValue("overlay");
  });

  test("effects section exists (drop shadow, stroke)", async ({ editorPage: page }) => {
    test.slow();

    // We need a selected object for the effects section to appear.
    // Draw something on the canvas to create an object.
    await selectTool(page, "shape-rect");
    await drawOnCanvas(page, 100, 100, 300, 250);
    await page.waitForTimeout(500);

    // Switch to move tool and click the shape to select it
    await selectTool(page, "move");
    const canvas = page.locator("canvas").first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");
    await page.mouse.click(box.x + 200, box.y + 175);
    await page.waitForTimeout(300);

    // Switch to layers tab to see effects
    await page.locator("[data-testid='tab-layers']").click();
    await page.waitForTimeout(300);

    // The Layer Effects section should be visible
    const effectsLabel = page.getByText("Layer Effects");
    await expect(effectsLabel).toBeVisible();

    // Drop Shadow and Stroke labels should exist
    await expect(page.getByText("Drop Shadow").first()).toBeVisible();
    await expect(page.getByText("Stroke").first()).toBeVisible();
  });

  test("drop shadow toggle enables shadow settings", async ({ editorPage: page }) => {
    test.slow();

    // Create and select a shape object
    await selectTool(page, "shape-rect");
    await drawOnCanvas(page, 100, 100, 300, 250);
    await page.waitForTimeout(500);

    await selectTool(page, "move");
    const canvas = page.locator("canvas").first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");
    await page.mouse.click(box.x + 200, box.y + 175);
    await page.waitForTimeout(300);

    await page.locator("[data-testid='tab-layers']").click();
    await page.waitForTimeout(300);

    // Find the Drop Shadow checkbox
    const dropShadowLabel = page.locator("label").filter({ hasText: "Drop Shadow" });
    const dropShadowCheckbox = dropShadowLabel.locator("input[type='checkbox']");
    await dropShadowCheckbox.scrollIntoViewIfNeeded();

    // Initially unchecked
    await expect(dropShadowCheckbox).not.toBeChecked();

    // Enable drop shadow
    await dropShadowCheckbox.check();
    await page.waitForTimeout(300);

    await expect(dropShadowCheckbox).toBeChecked();

    // Expand the section to see controls by clicking the chevron
    const expandBtn = dropShadowLabel.locator("..").locator("button[aria-label*='Expand']");
    if (await expandBtn.isVisible()) {
      await expandBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test("layer opacity slider works", async ({ editorPage: page }) => {
    const slider = page.locator("[data-testid='layer-opacity-slider']");
    await expect(slider).toBeVisible();

    // Default opacity should be 100 (full)
    await expect(slider).toHaveValue("100");

    // Change opacity to 50
    await slider.fill("50");
    await page.waitForTimeout(300);

    await expect(slider).toHaveValue("50");

    // Change back to 75
    await slider.fill("75");
    await page.waitForTimeout(300);

    await expect(slider).toHaveValue("75");
  });
});
