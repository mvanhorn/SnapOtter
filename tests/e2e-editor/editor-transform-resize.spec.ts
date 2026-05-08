import { createNewDocument, drawOnCanvas, expect, selectTool, test } from "./helpers";

test.describe("Editor Transform and Resize", () => {
  test.beforeEach(async ({ editorPage: page }) => {
    await createNewDocument(page);
  });

  test("resize canvas dialog opens and works", async ({ editorPage: page }) => {
    // Right-click on the canvas to open the context menu
    const canvas = page.locator("canvas").first();
    await canvas.click({ button: "right" });
    await page.waitForTimeout(300);

    // Click "Canvas Size..." in the context menu
    const canvasSizeBtn = page.locator("button").filter({ hasText: "Canvas Size..." });
    await expect(canvasSizeBtn).toBeVisible();
    await canvasSizeBtn.click();
    await page.waitForTimeout(300);

    // The Canvas Size dialog should appear
    const dialogTitle = page.getByText("Canvas Size", { exact: true });
    await expect(dialogTitle).toBeVisible();

    // Width and Height inputs should be visible
    const widthInput = page.locator("#canvas-w");
    const heightInput = page.locator("#canvas-h");
    await expect(widthInput).toBeVisible();
    await expect(heightInput).toBeVisible();

    // Anchor buttons should be present (9-point grid)
    const anchorButtons = page.locator("button[aria-label^='Anchor']");
    await expect(anchorButtons).toHaveCount(9);

    // Background color input should be visible
    const bgColorInput = page.locator("#canvas-fill");
    await expect(bgColorInput).toBeVisible();

    // Apply and Cancel buttons should be present
    await expect(page.locator("button").filter({ hasText: "Apply" })).toBeVisible();
    await expect(page.locator("button").filter({ hasText: "Cancel" })).toBeVisible();

    // Cancel should close the dialog
    await page.locator("button").filter({ hasText: "Cancel" }).click();
    await page.waitForTimeout(300);

    // Dialog should be gone
    await expect(dialogTitle).not.toBeVisible();
  });

  test("resize image dialog opens and works", async ({ editorPage: page }) => {
    // Right-click on the canvas to open the context menu
    const canvas = page.locator("canvas").first();
    await canvas.click({ button: "right" });
    await page.waitForTimeout(300);

    // Click "Image Size..." in the context menu
    const imageSizeBtn = page.locator("button").filter({ hasText: "Image Size..." });
    await expect(imageSizeBtn).toBeVisible();
    await imageSizeBtn.click();
    await page.waitForTimeout(300);

    // The Image Size dialog should appear
    const dialogTitle = page.getByText("Image Size", { exact: true });
    await expect(dialogTitle).toBeVisible();

    // Width and Height inputs should be visible
    const widthInput = page.locator("#img-w");
    const heightInput = page.locator("#img-h");
    await expect(widthInput).toBeVisible();
    await expect(heightInput).toBeVisible();

    // Aspect ratio lock button should be visible
    const lockBtn = page.locator("button[aria-label*='aspect ratio']");
    await expect(lockBtn).toBeVisible();

    // Resampling select should be present
    const resampleSelect = page.locator("#resample");
    await expect(resampleSelect).toBeVisible();

    // It should have the expected options
    const options = resampleSelect.locator("option");
    const texts = await options.allTextContents();
    expect(texts).toContain("Nearest Neighbor (fast)");
    expect(texts).toContain("Bicubic (smooth)");

    // Cancel should close the dialog
    await page.locator("button").filter({ hasText: "Cancel" }).click();
    await page.waitForTimeout(300);
    await expect(dialogTitle).not.toBeVisible();
  });

  test("flip horizontal via transform options changes canvas", async ({ editorPage: page }) => {
    test.slow();

    // Draw an asymmetric shape so flip is visually detectable
    await selectTool(page, "brush");
    await drawOnCanvas(page, 50, 50, 200, 100);
    await page.waitForTimeout(300);

    // Switch to transform tool
    await selectTool(page, "transform");
    await page.waitForTimeout(300);

    const canvas = page.locator("canvas").first();
    const before = await canvas.screenshot();

    // Click the Flip Horizontal button in the transform options bar
    const flipHBtn = page.locator("button[aria-label='Flip Horizontal']");
    await expect(flipHBtn).toBeVisible();
    await flipHBtn.click();
    await page.waitForTimeout(500);

    const after = await canvas.screenshot();
    expect(Buffer.compare(before, after)).not.toBe(0);
  });

  test("flip vertical via transform options changes canvas", async ({ editorPage: page }) => {
    test.slow();

    // Draw an asymmetric shape so flip is visually detectable
    await selectTool(page, "brush");
    await drawOnCanvas(page, 50, 50, 100, 200);
    await page.waitForTimeout(300);

    // Switch to transform tool
    await selectTool(page, "transform");
    await page.waitForTimeout(300);

    const canvas = page.locator("canvas").first();
    const before = await canvas.screenshot();

    // Click the Flip Vertical button in the transform options bar
    const flipVBtn = page.locator("button[aria-label='Flip Vertical']");
    await expect(flipVBtn).toBeVisible();
    await flipVBtn.click();
    await page.waitForTimeout(500);

    const after = await canvas.screenshot();
    expect(Buffer.compare(before, after)).not.toBe(0);
  });
});
