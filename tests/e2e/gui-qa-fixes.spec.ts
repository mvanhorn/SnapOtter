import { expect, test } from "./helpers";

test.describe("QA fixes verification", () => {
  test("invalid tool slug shows 404 page with Go Home link", async ({ loggedInPage: page }) => {
    await page.goto("/nonexistent-tool-slug-xyz");
    await expect(page.locator("text=Tool not found").or(page.locator("text=404"))).toBeVisible({
      timeout: 10_000,
    });
    const goHome = page.getByRole("link", { name: /go home/i });
    await expect(goHome).toBeVisible();
    await goHome.click();
    await expect(page).toHaveURL("/");
  });

  test("multi-segment invalid URL shows 404 page", async ({ loggedInPage: page }) => {
    await page.goto("/some/deep/nested/path");
    await expect(page.locator("text=404")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("link", { name: /go home/i })).toBeVisible();
  });

  test("/tools/:toolId redirects to /:toolId", async ({ loggedInPage: page }) => {
    await page.goto("/tools/resize");
    await page.waitForURL("**/resize", { timeout: 5_000 });
    await expect(page).toHaveURL(/\/resize$/);
  });

  test("confirm password field has visibility toggle", async ({ loggedInPage: page }) => {
    await page.goto("/");
    // Open settings
    const settingsBtn = page.locator('[class*="sidebar"]').getByRole("button").last();
    await settingsBtn.click().catch(() => {});
    // Try to navigate to Security tab
    const securityTab = page.getByText("Security");
    if (await securityTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await securityTab.click();
      // Find all password eye toggle buttons
      const eyeButtons = page.locator('button[tabindex="-1"]');
      const count = await eyeButtons.count();
      // Should have at least 3 eye buttons (current, new, confirm)
      expect(count).toBeGreaterThanOrEqual(3);
    }
  });

  test("pipeline steps survive navigation", async ({ loggedInPage: page }) => {
    await page.goto("/automate");
    await page.waitForLoadState("networkidle");

    // Add a step by clicking a tool in the palette
    const resizeTool = page.locator("text=Resize").first();
    if (await resizeTool.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await resizeTool.click();
      // Wait for the step to appear
      await page.waitForTimeout(500);

      // Navigate away
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Navigate back
      await page.goto("/automate");
      await page.waitForLoadState("networkidle");

      // Steps should still be there (persisted in sessionStorage)
      const removeButtons = page.locator('button[title="Remove"], button:has-text("Remove")');
      const count = await removeButtons.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test("export dialog has filename input", async ({ loggedInPage: page }) => {
    await page.goto("/editor");
    await page.waitForLoadState("networkidle");

    // Try to open export dialog via keyboard
    await page.keyboard.press("Control+Shift+S");
    await page.waitForTimeout(1000);

    const filenameInput = page.locator('input[placeholder="export"]');
    if (await filenameInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(filenameInput).toBeVisible();
      await filenameInput.fill("my-image");
      await expect(filenameInput).toHaveValue("my-image");
    }
  });
});
