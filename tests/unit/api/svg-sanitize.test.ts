import { gzipSync } from "node:zlib";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../apps/api/src/config.js", () => ({
  env: { MAX_SVG_SIZE_MB: 10 },
}));

import {
  decompressSvgz,
  isSvgBuffer,
  sanitizeSvg,
} from "../../../apps/api/src/lib/svg-sanitize.js";

describe("sanitizeSvg", () => {
  it("removes DOCTYPE declarations", () => {
    const input = Buffer.from(
      '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg><rect/></svg>',
    );
    const result = sanitizeSvg(input).toString("utf-8");
    expect(result).not.toContain("DOCTYPE");
    expect(result).toContain("<svg>");
  });

  it("removes DOCTYPE with internal subset (XXE prevention)", () => {
    const input = Buffer.from(
      '<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg><text>&xxe;</text></svg>',
    );
    const result = sanitizeSvg(input).toString("utf-8");
    expect(result).not.toContain("DOCTYPE");
    expect(result).not.toContain("ENTITY");
  });

  it("removes script tags", () => {
    const input = Buffer.from(
      '<svg><script>alert("xss")</script><rect width="10" height="10"/></svg>',
    );
    const result = sanitizeSvg(input).toString("utf-8");
    expect(result).not.toContain("<script");
    expect(result).not.toContain("alert");
    expect(result).toContain("<rect");
  });

  it("removes foreignObject elements", () => {
    const input = Buffer.from("<svg><foreignObject><body>evil</body></foreignObject><rect/></svg>");
    const result = sanitizeSvg(input).toString("utf-8");
    expect(result).not.toContain("foreignObject");
    expect(result).toContain("<rect/>");
  });

  it("removes event handlers (onload, onclick, onerror)", () => {
    const input = Buffer.from(
      '<svg onload="alert(1)"><rect onclick="steal()" onerror="hack()"/></svg>',
    );
    const result = sanitizeSvg(input).toString("utf-8");
    expect(result).not.toContain("onload=");
    expect(result).not.toContain("onclick=");
    expect(result).not.toContain("onerror=");
  });

  it("blocks javascript: URIs in href", () => {
    const input = Buffer.from('<svg><a href="javascript:alert(1)"><text>click</text></a></svg>');
    const result = sanitizeSvg(input).toString("utf-8");
    expect(result).not.toContain("javascript:");
  });

  it("blocks http/https URLs in href", () => {
    const input = Buffer.from('<svg><image href="https://evil.com/track.png"/></svg>');
    const result = sanitizeSvg(input).toString("utf-8");
    expect(result).not.toContain("https://evil.com");
  });

  it("blocks http/https URLs in xlink:href", () => {
    const input = Buffer.from('<svg><use xlink:href="http://evil.com/sprite.svg#icon"/></svg>');
    const result = sanitizeSvg(input).toString("utf-8");
    expect(result).not.toContain("http://evil.com");
  });

  it("blocks data:text/html URIs", () => {
    const input = Buffer.from(
      '<svg><a href="data:text/html,<script>alert(1)</script>"><text>x</text></a></svg>',
    );
    const result = sanitizeSvg(input).toString("utf-8");
    expect(result).not.toContain("data:text/html");
  });

  it("blocks file: URIs", () => {
    const input = Buffer.from('<svg><image href="file:///etc/passwd"/></svg>');
    const result = sanitizeSvg(input).toString("utf-8");
    expect(result).not.toContain("file:///etc/passwd");
  });

  it("blocks external url() references", () => {
    const input = Buffer.from("<svg><rect style=\"fill: url('https://evil.com/track')\"/></svg>");
    const result = sanitizeSvg(input).toString("utf-8");
    expect(result).not.toContain("https://evil.com");
  });

  it("blocks file: url() references", () => {
    const input = Buffer.from('<svg><rect style="fill: url(file:///etc/passwd)"/></svg>');
    const result = sanitizeSvg(input).toString("utf-8");
    expect(result).not.toContain("file:///etc/passwd");
  });

  it("removes XInclude elements", () => {
    const input = Buffer.from(
      '<svg xmlns:xi="http://www.w3.org/2001/XInclude"><xi:include href="file:///etc/passwd"/></svg>',
    );
    const result = sanitizeSvg(input).toString("utf-8");
    expect(result).not.toContain("xi:include");
  });

  it("preserves valid SVG content", () => {
    const input = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect x="0" y="0" width="100" height="100" fill="red"/><circle cx="50" cy="50" r="25" fill="blue"/></svg>',
    );
    const result = sanitizeSvg(input).toString("utf-8");
    expect(result).toContain("<svg");
    expect(result).toContain("<rect");
    expect(result).toContain("<circle");
    expect(result).toContain('fill="red"');
    expect(result).toContain('fill="blue"');
  });

  it("throws on oversized SVG", async () => {
    const configMod = await import("../../../apps/api/src/config.js");
    const saved = configMod.env.MAX_SVG_SIZE_MB;
    configMod.env.MAX_SVG_SIZE_MB = 0.000001;
    try {
      const input = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>');
      expect(() => sanitizeSvg(input)).toThrow("SVG exceeds maximum size");
    } finally {
      configMod.env.MAX_SVG_SIZE_MB = saved;
    }
  });

  it("does NOT remove xml processing instruction", () => {
    const input = Buffer.from('<?xml version="1.0" encoding="UTF-8"?><svg><rect/></svg>');
    const result = sanitizeSvg(input).toString("utf-8");
    expect(result).toContain("<?xml");
  });
});

describe("decompressSvgz", () => {
  it("returns non-gzipped buffer unchanged", () => {
    const input = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>');
    const result = decompressSvgz(input);
    expect(result).toBe(input);
  });

  it("decompresses valid SVGZ content", () => {
    const svgContent =
      '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>';
    const compressed = gzipSync(Buffer.from(svgContent));
    const result = decompressSvgz(compressed);
    expect(result.toString("utf-8")).toBe(svgContent);
  });

  it("throws on decompressed content that is not SVG", () => {
    const notSvg = gzipSync(Buffer.from("this is just plain text, not SVG at all"));
    expect(() => decompressSvgz(notSvg)).toThrow("does not contain valid SVG");
  });

  it("returns short buffer unchanged (less than 2 bytes)", () => {
    const tiny = Buffer.from([0x42]);
    expect(decompressSvgz(tiny)).toBe(tiny);
  });

  it("returns buffer unchanged when first bytes do not match gzip magic", () => {
    const notGzip = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
    expect(decompressSvgz(notGzip)).toBe(notGzip);
  });
});

describe("isSvgBuffer", () => {
  it("returns true for buffer starting with <svg", () => {
    const input = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    expect(isSvgBuffer(input)).toBe(true);
  });

  it("returns true for buffer starting with <?xml followed by <svg", () => {
    const input = Buffer.from('<?xml version="1.0"?><svg><rect/></svg>');
    expect(isSvgBuffer(input)).toBe(true);
  });

  it("returns false for PNG buffer", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(isSvgBuffer(png)).toBe(false);
  });

  it("returns false for empty buffer", () => {
    expect(isSvgBuffer(Buffer.alloc(0))).toBe(false);
  });

  it("returns false for plain text buffer", () => {
    const text = Buffer.from("Hello, this is not an SVG file");
    expect(isSvgBuffer(text)).toBe(false);
  });

  it("returns true for SVG with leading whitespace", () => {
    const input = Buffer.from('  \n  <svg xmlns="http://www.w3.org/2000/svg"></svg>');
    expect(isSvgBuffer(input)).toBe(true);
  });

  it("returns true for <?xml with leading whitespace before <svg", () => {
    const input = Buffer.from('<?xml version="1.0"?>\n<svg><rect/></svg>');
    expect(isSvgBuffer(input)).toBe(true);
  });
});
