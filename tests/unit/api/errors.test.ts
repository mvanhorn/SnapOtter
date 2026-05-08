import { describe, expect, it } from "vitest";
import { formatZodErrors } from "../../../apps/api/src/lib/errors.js";

describe("formatZodErrors", () => {
  it("formats single issue with path", () => {
    const result = formatZodErrors([
      { path: ["width"], message: "Must be positive", code: "custom" },
    ]);
    expect(result).toBe("width: Must be positive");
  });

  it("formats single issue without path", () => {
    const result = formatZodErrors([{ path: [], message: "Invalid input", code: "custom" }]);
    expect(result).toBe("Invalid input");
  });

  it("joins multiple issues with semicolons", () => {
    const result = formatZodErrors([
      { path: ["width"], message: "Required", code: "custom" },
      { path: ["height"], message: "Must be positive", code: "custom" },
    ]);
    expect(result).toBe("width: Required; height: Must be positive");
  });

  it("returns empty string for empty array", () => {
    const result = formatZodErrors([]);
    expect(result).toBe("");
  });

  it("joins nested paths with dots", () => {
    const result = formatZodErrors([
      { path: ["settings", "quality"], message: "Too high", code: "custom" },
    ]);
    expect(result).toBe("settings.quality: Too high");
  });
});
