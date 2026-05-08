import { createNewDocument, expect, selectTool, test } from "./helpers";

test.describe("Editor Options Bar", () => {
  test.beforeEach(async ({ editorPage: page }) => {
    await createNewDocument(page);
  });

  test("eyedropper options show sample size when eyedropper selected", async ({
    editorPage: page,
  }) => {
    await selectTool(page, "eyedropper");

    // The options bar should display the Sample label and dropdown
    await expect(page.getByText("Sample:")).toBeVisible();

    const sampleDropdown = page.locator("[data-testid='sample-size-dropdown']");
    await expect(sampleDropdown).toBeVisible();

    // Should default to "Point (1x1)"
    await expect(sampleDropdown).toContainText("Point (1x1)");

    // Clicking the dropdown should reveal size options
    await sampleDropdown.click();
    await page.waitForTimeout(300);

    await expect(page.getByText("3x3 Average")).toBeVisible();
    await expect(page.getByText("5x5 Average")).toBeVisible();
  });

  test("transform options show position/size when transform selected", async ({
    editorPage: page,
  }) => {
    await selectTool(page, "transform");

    // The options bar should show X, Y, W, H, Rotation inputs
    await expect(page.locator("#transform-x")).toBeVisible();
    await expect(page.locator("#transform-y")).toBeVisible();
    await expect(page.locator("#transform-w")).toBeVisible();
    await expect(page.locator("#transform-h")).toBeVisible();
    await expect(page.locator("#transform-rotation")).toBeVisible();

    // Flip buttons should be visible
    await expect(page.locator("button[aria-label='Flip Horizontal']")).toBeVisible();
    await expect(page.locator("button[aria-label='Flip Vertical']")).toBeVisible();

    // Aspect ratio lock button should be visible
    const lockBtn = page.locator("button[aria-label*='aspect ratio']");
    await expect(lockBtn).toBeVisible();
  });

  test("brush options show size, opacity, hardness", async ({ editorPage: page }) => {
    await selectTool(page, "brush");

    const optionsBar = page.locator(".flex.items-center.h-10");

    // Size, Opacity, and Hardness labels should be in the options bar
    await expect(optionsBar.getByText("Size")).toBeVisible();
    await expect(optionsBar.getByText("Opacity")).toBeVisible();
    await expect(optionsBar.getByText("Hardness")).toBeVisible();

    // Each should have a range slider and a number input
    const sizeSlider = optionsBar
      .locator("label")
      .filter({ hasText: "Size" })
      .locator("input[type='range']");
    await expect(sizeSlider).toBeVisible();

    const opacitySlider = optionsBar
      .locator("label")
      .filter({ hasText: "Opacity" })
      .locator("input[type='range']");
    await expect(opacitySlider).toBeVisible();

    const hardnessSlider = optionsBar
      .locator("label")
      .filter({ hasText: "Hardness" })
      .locator("input[type='range']");
    await expect(hardnessSlider).toBeVisible();
  });

  test("selection options show mode dropdown", async ({ editorPage: page }) => {
    await selectTool(page, "marquee-rect");

    // The options bar should show Type and Mode sections
    await expect(page.getByText("Type:")).toBeVisible();
    await expect(page.getByText("Mode:")).toBeVisible();

    // Type buttons: Rect, Ellipse, Lasso
    const rectBtn = page.locator("button[aria-label='Rectangular']");
    const ellipseBtn = page.locator("button[aria-label='Elliptical']");
    const lassoBtn = page.locator("button[aria-label='Lasso']");

    await expect(rectBtn).toBeVisible();
    await expect(ellipseBtn).toBeVisible();
    await expect(lassoBtn).toBeVisible();

    // Rect should be active (pressed) since we selected marquee-rect
    await expect(rectBtn).toHaveAttribute("aria-pressed", "true");

    // Mode buttons: New, Add, Sub
    const newBtn = page.locator("button[aria-label='New Selection']");
    const addBtn = page.locator("button[aria-label='Add to Selection']");
    const subBtn = page.locator("button[aria-label='Subtract from Selection']");

    await expect(newBtn).toBeVisible();
    await expect(addBtn).toBeVisible();
    await expect(subBtn).toBeVisible();
  });
});
