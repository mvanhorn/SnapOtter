import { defineConfig, devices } from "@playwright/test";

const demoPort = 4174;
const demoBaseUrl = `http://127.0.0.1:${demoPort}`;

export default defineConfig({
  testDir: "./tests/e2e-demo",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: demoBaseUrl,
    ...devices["Desktop Chrome"],
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `pnpm --filter @snapotter/demo exec vite preview --host 127.0.0.1 --port ${demoPort} --strictPort`,
    url: demoBaseUrl,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
