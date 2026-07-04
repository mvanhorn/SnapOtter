import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const workflowPath = path.resolve(process.cwd(), ".github/workflows/deploy-demo.yml");

function workflowText(): string {
  expect(existsSync(workflowPath)).toBe(true);
  return readFileSync(workflowPath, "utf8");
}

function expectBefore(workflow: string, earlier: string, later: string) {
  const earlierIndex = workflow.indexOf(earlier);
  const laterIndex = workflow.indexOf(later);

  expect(earlierIndex, `${earlier} should exist in the workflow`).toBeGreaterThanOrEqual(0);
  expect(laterIndex, `${later} should exist in the workflow`).toBeGreaterThanOrEqual(0);
  expect(earlierIndex, `${earlier} should run before ${later}`).toBeLessThan(laterIndex);
}

describe("demo deployment workflow", () => {
  it("deploys the demo app to the Cloudflare Pages demo project", () => {
    const workflow = workflowText();

    expect(workflow).toContain("name: Deploy Demo to Cloudflare Pages");
    expect(workflow).toContain("pnpm --filter @snapotter/demo build");
    expect(workflow).toContain(
      "npx wrangler pages deploy apps/demo/dist --project-name snapotter-demo --branch main --commit-dirty=true",
    );
    expect(workflow).toContain("CLOUDFLARE_API_TOKEN: $" + "{{ secrets.CLOUDFLARE_API_TOKEN }}");
    expect(workflow).toContain("CLOUDFLARE_ACCOUNT_ID: $" + "{{ secrets.CLOUDFLARE_ACCOUNT_ID }}");
  });

  it("runs focused demo gates before publishing to Cloudflare", () => {
    const workflow = workflowText();
    const deployCommand =
      "npx wrangler pages deploy apps/demo/dist --project-name snapotter-demo --branch main --commit-dirty=true";

    for (const gateCommand of [
      "pnpm vitest run --config vitest.config.ts tests/unit/infra/demo-theme.test.ts tests/unit/infra/deploy-demo-workflow.test.ts tests/unit/infra/demo-mock-api.test.ts",
      "pnpm --filter @snapotter/demo exec tsc --noEmit",
      "pnpm --filter @snapotter/demo build",
      "pnpm playwright install --with-deps chromium",
      "pnpm playwright test --config playwright.demo.config.ts",
    ]) {
      expectBefore(workflow, gateCommand, deployCommand);
    }
  });

  it("rebuilds when the demo shell, real app UI, shared code, or build inputs change", () => {
    const workflow = workflowText();

    for (const pathFilter of [
      '"apps/demo/**"',
      '"apps/web/**"',
      '"packages/shared/**"',
      '"package.json"',
      '"pnpm-lock.yaml"',
      '"pnpm-workspace.yaml"',
      '"turbo.json"',
      '"tsconfig.base.json"',
      '".github/actions/setup/**"',
      '"playwright.demo.config.ts"',
      '"tests/e2e-demo/**"',
      '"tests/unit/infra/demo-theme.test.ts"',
      '"tests/unit/infra/demo-mock-api.test.ts"',
      '"tests/unit/infra/deploy-demo-workflow.test.ts"',
      '".github/workflows/deploy-demo.yml"',
    ]) {
      expect(workflow).toContain(pathFilter);
    }

    expect(workflow).toContain("branches: [main]");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("concurrency:");
    expect(workflow).toContain("group: deploy-demo");
  });
});
