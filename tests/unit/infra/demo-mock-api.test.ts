import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { matchDemoRoute } from "../../../apps/demo/src/mock-api.js";

const packageJson = JSON.parse(
  readFileSync(path.resolve(process.cwd(), "package.json"), "utf8"),
) as { version: string };

async function readJson(response: Response): Promise<unknown> {
  return response.json();
}

describe("demo mock API", () => {
  it("reports the same app version as the current package build", async () => {
    const response = matchDemoRoute("/api/v1/health", "GET");

    expect(response?.status).toBe(200);
    await expect(readJson(response as Response)).resolves.toMatchObject({
      status: "ok",
      version: packageJson.version,
    });
  });

  it("returns the full auth configuration shape consumed by the real web app", async () => {
    const response = matchDemoRoute("/api/v1/config/auth", "GET");

    expect(response?.status).toBe(200);
    await expect(readJson(response as Response)).resolves.toEqual({
      authEnabled: true,
      oidcEnabled: false,
      oidcProviderName: null,
      samlEnabled: false,
      samlProviderName: null,
      ssoEnforced: false,
    });
  });
});
