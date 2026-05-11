import { describe, expect, it } from "vitest";
import { extractUrls } from "../../../apps/web/src/lib/url-parser.js";

describe("extractUrls", () => {
  it("extracts plain URLs one per line", () => {
    const input = "https://example.com/a.jpg\nhttps://example.com/b.png";
    expect(extractUrls(input)).toEqual(["https://example.com/a.jpg", "https://example.com/b.png"]);
  });

  it("strips numbered list prefixes", () => {
    const input =
      "1. https://example.com/a.jpg\n2) https://example.com/b.png\n3 https://example.com/c.webp";
    expect(extractUrls(input)).toEqual([
      "https://example.com/a.jpg",
      "https://example.com/b.png",
      "https://example.com/c.webp",
    ]);
  });

  it("strips bullet prefixes", () => {
    const input =
      "- https://example.com/a.jpg\n* https://example.com/b.png\n+ https://example.com/c.webp";
    expect(extractUrls(input)).toEqual([
      "https://example.com/a.jpg",
      "https://example.com/b.png",
      "https://example.com/c.webp",
    ]);
  });

  it("extracts URLs from markdown links", () => {
    const input = "[Photo 1](https://example.com/a.jpg)\n[Photo 2](https://example.com/b.png)";
    expect(extractUrls(input)).toEqual(["https://example.com/a.jpg", "https://example.com/b.png"]);
  });

  it("extracts URLs from HTML img tags", () => {
    const input = '<img src="https://example.com/a.jpg">\n<img src="https://example.com/b.png" />';
    expect(extractUrls(input)).toEqual(["https://example.com/a.jpg", "https://example.com/b.png"]);
  });

  it("handles mixed formats", () => {
    const input = `1. https://example.com/a.jpg
- [Photo](https://example.com/b.png)
<img src="https://example.com/c.webp">
https://example.com/d.avif`;
    expect(extractUrls(input)).toEqual([
      "https://example.com/a.jpg",
      "https://example.com/b.png",
      "https://example.com/c.webp",
      "https://example.com/d.avif",
    ]);
  });

  it("deduplicates URLs", () => {
    const input = "https://example.com/a.jpg\nhttps://example.com/a.jpg";
    expect(extractUrls(input)).toEqual(["https://example.com/a.jpg"]);
  });

  it("filters out non-HTTP URLs", () => {
    const input = "ftp://example.com/a.jpg\nhttps://example.com/b.png\nnot-a-url";
    expect(extractUrls(input)).toEqual(["https://example.com/b.png"]);
  });

  it("returns empty array for empty input", () => {
    expect(extractUrls("")).toEqual([]);
    expect(extractUrls("  \n  \n  ")).toEqual([]);
  });

  it("preserves URLs with query parameters", () => {
    const input = "https://example.com/photo?id=123&size=large";
    expect(extractUrls(input)).toEqual(["https://example.com/photo?id=123&size=large"]);
  });
});
