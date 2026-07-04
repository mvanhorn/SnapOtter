import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const demoStylesPath = path.resolve(process.cwd(), "apps/demo/src/styles/globals.css");
const demoBannerPath = path.resolve(process.cwd(), "apps/demo/src/demo-banner.tsx");
const demoHtmlPath = path.resolve(process.cwd(), "apps/demo/index.html");
const demoMainPath = path.resolve(process.cwd(), "apps/demo/src/main.tsx");
const webHtmlPath = path.resolve(process.cwd(), "apps/web/index.html");
const webManifestPath = path.resolve(process.cwd(), "apps/web/public/manifest.json");
const webStylesPath = path.resolve(process.cwd(), "apps/web/src/styles/globals.css");

function readFixture(filePath: string): string {
  return readFileSync(filePath, "utf8");
}

describe("demo theme", () => {
  it("inherits the real web app global stylesheet instead of carrying copied color tokens", () => {
    const demoStyles = readFixture(demoStylesPath);

    expect(demoStyles).toContain('@import "../../../web/src/styles/globals.css";');
    expect(demoStyles).toContain('@source "../../../web/src/**/*.tsx";');
    expect(demoStyles).toContain('@source "../../../web/src/**/*.ts";');
    expect(demoStyles).not.toContain("--color-primary:");
    expect(demoStyles).not.toContain("#3b82f6");
  });

  it("does not hardcode the old blue demo accent in demo-only UI", () => {
    const demoOnlyUi = [demoBannerPath, demoMainPath].map(readFixture).join("\n");

    expect(demoOnlyUi).not.toMatch(/bg-blue-|text-blue-|hover:bg-blue-|hover:text-blue-|#3b82f6/i);
  });

  it("uses the current app primary color for browser theme metadata", () => {
    const webStyles = readFixture(webStylesPath);
    const primaryColor = webStyles.match(/--color-primary:\s*(#[0-9a-f]{6})/i)?.[1];

    expect(primaryColor).toBeDefined();

    for (const htmlPath of [demoHtmlPath, webHtmlPath]) {
      expect(readFixture(htmlPath)).toContain(`name="theme-color" content="${primaryColor}"`);
    }

    expect(JSON.parse(readFixture(webManifestPath))).toMatchObject({
      theme_color: primaryColor,
    });
  });
});
