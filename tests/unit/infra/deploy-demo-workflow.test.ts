import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const workflowPath = path.resolve(process.cwd(), ".github/workflows/deploy-demo.yml");

function workflowText(): string {
  expect(existsSync(workflowPath)).toBe(true);
  return readFileSync(workflowPath, "utf8");
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

  it("rebuilds when the demo shell, real app UI, shared code, or build inputs change", () => {
    const workflow = workflowText();

    for (const pathFilter of [
      '"apps/demo/**"',
      '"apps/web/**"',
      '"packages/shared/**"',
      '"package.json"',
      '"pnpm-lock.yaml"',
      '"pnpm-workspace.yaml"',
      '".github/actions/setup/**"',
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
