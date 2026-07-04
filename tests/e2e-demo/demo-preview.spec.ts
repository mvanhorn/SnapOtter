import { expect, test } from "@playwright/test";

test("demo preview uses the real app theme and reaches a tool page", async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await page.goto("/login");
  await expect(page.getByText("This is a live demo. Processing is disabled.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();

  const theme = await page.evaluate(() => {
    const bannerLink = Array.from(document.querySelectorAll("a")).find((link) =>
      link.textContent?.includes("Self-host SnapOtter"),
    );
    const banner = bannerLink?.closest("div");

    return {
      primary: getComputedStyle(document.documentElement)
        .getPropertyValue("--color-primary")
        .trim(),
      themeColor: document.querySelector('meta[name="theme-color"]')?.getAttribute("content"),
      bannerBackground: banner ? getComputedStyle(banner).backgroundColor : null,
    };
  });

  expect(theme.primary.toLowerCase()).toBe("#e07832");
  expect(theme.themeColor?.toLowerCase()).toBe("#e07832");
  expect(theme.bannerBackground).toBe("rgb(224, 120, 50)");

  await page.getByLabel("Username").fill("demo");
  await page.getByLabel("Password").fill("demo");
  await page.getByRole("button", { name: /^login$/i }).click();

  await page.waitForURL(/\/change-password$/);
  await expect(page.getByRole("heading", { name: "Change your password" })).toBeVisible();

  await page.evaluate(() => {
    localStorage.setItem("snapotter-demo-state", JSON.stringify({ passwordChanged: true }));
  });

  await page.goto("/");
  const allTab = page.getByRole("button", { name: /^All\s*\d+$/ });
  await expect(allTab).toBeVisible();
  const allCount = Number((await allTab.textContent())?.match(/\d+$/)?.[0] ?? 0);
  expect(allCount).toBeGreaterThan(100);

  await page.goto("/image/compress");
  await expect(page.getByRole("heading", { name: "Compress" })).toBeVisible();
  await expect(page.getByText("Drop your files here")).toBeVisible();
  await expect(page.getByRole("button", { name: "Upload from computer" })).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});
