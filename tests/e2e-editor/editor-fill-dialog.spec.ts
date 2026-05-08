import { createNewDocument, expect, test } from "./helpers";

test.describe("Editor Fill Dialog", () => {
  test.beforeEach(async ({ editorPage: page }) => {
    await createNewDocument(page);
  });

  test("Shift+Backspace opens fill dialog", async ({ editorPage: page }) => {
    // Press Shift+Backspace to open the fill dialog
    await page.keyboard.press("Shift+Backspace");
    await page.waitForTimeout(500);

    // The fill dialog should appear
    const dialog = page.locator("div[role='dialog'][aria-label='Fill']");
    await expect(dialog).toBeVisible();

    // It should have the "Fill" heading
    await expect(dialog.getByText("Fill", { exact: true })).toBeVisible();
  });

  test("fill dialog has color options", async ({ editorPage: page }) => {
    // Open the fill dialog
    await page.keyboard.press("Shift+Backspace");
    await page.waitForTimeout(500);

    const dialog = page.locator("div[role='dialog'][aria-label='Fill']");
    await expect(dialog).toBeVisible();

    // Contents dropdown should be visible
    await expect(dialog.getByText("Contents")).toBeVisible();
    const contentsSelect = dialog.locator("select");
    await expect(contentsSelect).toBeVisible();

    // Check the available fill options
    const options = contentsSelect.locator("option");
    const texts = await options.allTextContents();
    expect(texts).toContain("Foreground Color");
    expect(texts).toContain("Background Color");
    expect(texts).toContain("Color...");
    expect(texts).toContain("White");
    expect(texts).toContain("Black");
    expect(texts).toContain("50% Gray");

    // Opacity slider should be visible
    await expect(dialog.getByText("Opacity")).toBeVisible();
    const opacityRange = dialog.locator("input[type='range']");
    await expect(opacityRange).toBeVisible();

    // Preview swatch should be visible
    await expect(dialog.getByText("Preview:")).toBeVisible();

    // OK and Cancel buttons should be present
    await expect(dialog.locator("button").filter({ hasText: "OK" })).toBeVisible();
    await expect(dialog.locator("button").filter({ hasText: "Cancel" })).toBeVisible();
  });

  test("fill dialog can be closed with Escape", async ({ editorPage: page }) => {
    // Open the fill dialog
    await page.keyboard.press("Shift+Backspace");
    await page.waitForTimeout(500);

    const dialog = page.locator("div[role='dialog'][aria-label='Fill']");
    await expect(dialog).toBeVisible();

    // Press Escape to close
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // Dialog should be gone
    await expect(dialog).not.toBeVisible();
  });
});
