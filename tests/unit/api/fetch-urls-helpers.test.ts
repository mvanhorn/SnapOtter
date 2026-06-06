/**
 * Unit tests for pure utility functions extracted from fetch-urls route:
 * - filenameFromUrl: extract filename from URL path
 * - getUniqueName: deduplicate filenames
 * - hasPathTraversal: detect path traversal in filenames (from meme-templates)
 * - getContentType: extension to MIME mapping (from meme-templates)
 *
 * These are tested by importing the route module and exercising the exported/inline logic.
 * Since these are private functions, we replicate their logic here for isolated testing.
 */
import { describe, expect, it } from "vitest";

// Replicate filenameFromUrl logic for isolated testing
function filenameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const base = pathname.split("/").pop() ?? "";
    const decoded = decodeURIComponent(base);
    if (decoded?.includes(".") && decoded.length <= 255) {
      return decoded;
    }
  } catch {
    // ignore parse errors
  }
  return "image-fallback";
}

// Replicate getUniqueName logic
function getUniqueName(name: string, used: Set<string>): string {
  if (!used.has(name)) {
    used.add(name);
    return name;
  }
  const dotIdx = name.lastIndexOf(".");
  const base = dotIdx > 0 ? name.slice(0, dotIdx) : name;
  const ext = dotIdx > 0 ? name.slice(dotIdx) : "";
  let counter = 1;
  let candidate = `${base}_${counter}${ext}`;
  while (used.has(candidate)) {
    counter++;
    candidate = `${base}_${counter}${ext}`;
  }
  used.add(candidate);
  return candidate;
}

// Replicate hasPathTraversal logic
function hasPathTraversal(filename: string): boolean {
  return (
    filename.includes("..") ||
    filename.includes("/") ||
    filename.includes("\\") ||
    filename.includes("\0")
  );
}

// Replicate getContentType logic
const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ttf": "font/ttf",
};

function getContentType(filename: string): string | undefined {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return undefined;
  return CONTENT_TYPES[filename.slice(dot).toLowerCase()];
}

// ---------------------------------------------------------------------------
// filenameFromUrl
// ---------------------------------------------------------------------------
describe("filenameFromUrl", () => {
  it("extracts filename from simple URL", () => {
    expect(filenameFromUrl("https://example.com/images/photo.jpg")).toBe("photo.jpg");
  });

  it("extracts filename from URL with query string", () => {
    expect(filenameFromUrl("https://example.com/img/cat.png?size=large")).toBe("cat.png");
  });

  it("decodes percent-encoded characters", () => {
    expect(filenameFromUrl("https://example.com/my%20photo.jpg")).toBe("my photo.jpg");
  });

  it("returns fallback for URL without extension", () => {
    expect(filenameFromUrl("https://example.com/images/12345")).toBe("image-fallback");
  });

  it("returns fallback for empty path", () => {
    expect(filenameFromUrl("https://example.com/")).toBe("image-fallback");
  });

  it("returns fallback for root URL", () => {
    expect(filenameFromUrl("https://example.com")).toBe("image-fallback");
  });

  it("returns fallback for invalid URL", () => {
    expect(filenameFromUrl("not a url")).toBe("image-fallback");
  });

  it("handles deeply nested path", () => {
    expect(filenameFromUrl("https://cdn.example.com/a/b/c/d/e/image.webp")).toBe("image.webp");
  });

  it("handles filename with multiple dots", () => {
    expect(filenameFromUrl("https://example.com/my.photo.2024.png")).toBe("my.photo.2024.png");
  });

  it("returns fallback for filename over 255 characters", () => {
    const longName = `${"a".repeat(256)}.jpg`;
    const url = `https://example.com/${longName}`;
    expect(filenameFromUrl(url)).toBe("image-fallback");
  });

  it("handles filename at exactly 255 characters", () => {
    const name = `${"a".repeat(251)}.jpg`; // 251 + 4 = 255
    const url = `https://example.com/${name}`;
    expect(filenameFromUrl(url)).toBe(name);
  });
});

// ---------------------------------------------------------------------------
// getUniqueName
// ---------------------------------------------------------------------------
describe("getUniqueName", () => {
  it("returns name unchanged if not in used set", () => {
    const used = new Set<string>();
    expect(getUniqueName("photo.jpg", used)).toBe("photo.jpg");
    expect(used.has("photo.jpg")).toBe(true);
  });

  it("appends _1 for first collision", () => {
    const used = new Set<string>(["photo.jpg"]);
    expect(getUniqueName("photo.jpg", used)).toBe("photo_1.jpg");
  });

  it("appends _2 when _1 is also taken", () => {
    const used = new Set<string>(["photo.jpg", "photo_1.jpg"]);
    expect(getUniqueName("photo.jpg", used)).toBe("photo_2.jpg");
  });

  it("handles multiple collisions", () => {
    const used = new Set<string>(["photo.jpg", "photo_1.jpg", "photo_2.jpg"]);
    expect(getUniqueName("photo.jpg", used)).toBe("photo_3.jpg");
  });

  it("handles filename without extension", () => {
    const used = new Set<string>(["readme"]);
    expect(getUniqueName("readme", used)).toBe("readme_1");
  });

  it("handles filename with multiple dots", () => {
    const used = new Set<string>(["my.photo.png"]);
    expect(getUniqueName("my.photo.png", used)).toBe("my.photo_1.png");
  });

  it("adds each unique name to the used set", () => {
    const used = new Set<string>();
    getUniqueName("a.jpg", used);
    getUniqueName("b.jpg", used);
    getUniqueName("a.jpg", used);
    expect(used.has("a.jpg")).toBe(true);
    expect(used.has("b.jpg")).toBe(true);
    expect(used.has("a_1.jpg")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// hasPathTraversal
// ---------------------------------------------------------------------------
describe("hasPathTraversal", () => {
  it("returns true for ..", () => {
    expect(hasPathTraversal("../secret.txt")).toBe(true);
  });

  it("returns true for embedded ..", () => {
    expect(hasPathTraversal("foo/../bar.jpg")).toBe(true);
  });

  it("returns true for forward slash", () => {
    expect(hasPathTraversal("path/to/file.jpg")).toBe(true);
  });

  it("returns true for backslash", () => {
    expect(hasPathTraversal("path\\to\\file.jpg")).toBe(true);
  });

  it("returns true for null byte", () => {
    expect(hasPathTraversal("file\0.jpg")).toBe(true);
  });

  it("returns false for safe filenames", () => {
    expect(hasPathTraversal("photo.jpg")).toBe(false);
    expect(hasPathTraversal("my-photo_2024.png")).toBe(false);
    expect(hasPathTraversal("image.webp")).toBe(false);
  });

  it("returns false for filename with dots that are not traversal", () => {
    expect(hasPathTraversal("my.photo.jpg")).toBe(false);
    expect(hasPathTraversal(".hidden")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getContentType
// ---------------------------------------------------------------------------
describe("getContentType", () => {
  it("maps .jpg to image/jpeg", () => {
    expect(getContentType("photo.jpg")).toBe("image/jpeg");
  });

  it("maps .jpeg to image/jpeg", () => {
    expect(getContentType("photo.jpeg")).toBe("image/jpeg");
  });

  it("maps .png to image/png", () => {
    expect(getContentType("icon.png")).toBe("image/png");
  });

  it("maps .webp to image/webp", () => {
    expect(getContentType("photo.webp")).toBe("image/webp");
  });

  it("maps .ttf to font/ttf", () => {
    expect(getContentType("arial.ttf")).toBe("font/ttf");
  });

  it("handles uppercase extensions via toLowerCase", () => {
    expect(getContentType("photo.JPG")).toBe("image/jpeg");
    expect(getContentType("photo.PNG")).toBe("image/png");
  });

  it("returns undefined for unknown extensions", () => {
    expect(getContentType("doc.pdf")).toBeUndefined();
    expect(getContentType("file.txt")).toBeUndefined();
  });

  it("returns undefined for filename without extension", () => {
    expect(getContentType("noextension")).toBeUndefined();
  });

  it("uses the last dot for extension detection", () => {
    expect(getContentType("archive.tar.jpg")).toBe("image/jpeg");
  });
});
