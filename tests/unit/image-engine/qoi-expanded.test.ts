/**
 * Expanded QOI codec tests covering:
 * - LUMA encoding path (medium deltas)
 * - INDEX encoding path (repeated colors)
 * - RGBA encoding path (changing alpha)
 * - RGB encoding path (large deltas, same alpha)
 * - DIFF encoding path (small deltas)
 * - RUN encoding path (max run length 62)
 * - Run ending at last pixel vs mid-stream
 * - 3-channel encoding with alpha fixed at 255
 * - Edge cases: large images, alternating patterns
 */
import { qoiDecode, qoiEncode } from "@snapotter/image-engine";
import { describe, expect, it } from "vitest";

describe("QOI expanded codec paths", () => {
  it("exercises DIFF encoding for small color changes", () => {
    // Create pixels where each successive pixel differs by small amounts (-2..+1)
    const w = 4;
    const h = 1;
    const pixels = new Uint8Array(w * 4);
    // Pixel 0: (100, 100, 100, 255)
    pixels[0] = 100;
    pixels[1] = 100;
    pixels[2] = 100;
    pixels[3] = 255;
    // Pixel 1: (101, 99, 100, 255) -- dr=1, dg=-1, db=0 -- fits DIFF
    pixels[4] = 101;
    pixels[5] = 99;
    pixels[6] = 100;
    pixels[7] = 255;
    // Pixel 2: (100, 100, 101, 255) -- dr=-1, dg=1, db=1 -- fits DIFF
    pixels[8] = 100;
    pixels[9] = 100;
    pixels[10] = 101;
    pixels[11] = 255;
    // Pixel 3: (98, 101, 100, 255) -- dr=-2, dg=1, db=-1 -- fits DIFF
    pixels[12] = 98;
    pixels[13] = 101;
    pixels[14] = 100;
    pixels[15] = 255;

    const encoded = qoiEncode(pixels, w, h, 4);
    const { pixels: decoded } = qoiDecode(encoded);
    for (let i = 0; i < pixels.length; i++) {
      expect(decoded[i]).toBe(pixels[i]);
    }
  });

  it("exercises LUMA encoding for medium color changes", () => {
    // Deltas that fit LUMA but not DIFF (dg in -32..31, drDg and dbDg in -8..7)
    const w = 3;
    const h = 1;
    const pixels = new Uint8Array(w * 4);
    pixels[0] = 100;
    pixels[1] = 100;
    pixels[2] = 100;
    pixels[3] = 255;
    // dg=10, dr=10+5=15, db=10-3=7 -- LUMA range
    pixels[4] = 115;
    pixels[5] = 110;
    pixels[6] = 107;
    pixels[7] = 255;
    // dg=-20, dr=-20+2=-18, db=-20-5=-25 -- LUMA range
    pixels[8] = 97;
    pixels[9] = 90;
    pixels[10] = 82;
    pixels[11] = 255;

    const encoded = qoiEncode(pixels, w, h, 4);
    const { pixels: decoded } = qoiDecode(encoded);
    for (let i = 0; i < pixels.length; i++) {
      expect(decoded[i]).toBe(pixels[i]);
    }
  });

  it("exercises RGB encoding for large color changes with same alpha", () => {
    // Deltas too large for DIFF or LUMA, but alpha stays the same
    const w = 2;
    const h = 1;
    const pixels = new Uint8Array(w * 4);
    pixels[0] = 10;
    pixels[1] = 20;
    pixels[2] = 30;
    pixels[3] = 255;
    // Large jump: dr=200, dg=200, db=200 -- falls through to RGB
    pixels[4] = 210;
    pixels[5] = 220;
    pixels[6] = 230;
    pixels[7] = 255;

    const encoded = qoiEncode(pixels, w, h, 4);
    const { pixels: decoded } = qoiDecode(encoded);
    for (let i = 0; i < pixels.length; i++) {
      expect(decoded[i]).toBe(pixels[i]);
    }
    // Verify size: header (14) + first pixel RGB op (4) + second pixel RGB op (4) + end marker (8)
    // Actually first pixel deviates from prev (0,0,0,255), so it gets some op
    expect(encoded.length).toBeGreaterThan(14 + 8);
  });

  it("exercises RGBA encoding for alpha changes", () => {
    const w = 3;
    const h = 1;
    const pixels = new Uint8Array(w * 4);
    pixels[0] = 100;
    pixels[1] = 100;
    pixels[2] = 100;
    pixels[3] = 255;
    pixels[4] = 100;
    pixels[5] = 100;
    pixels[6] = 100;
    pixels[7] = 128; // alpha changed
    pixels[8] = 100;
    pixels[9] = 100;
    pixels[10] = 100;
    pixels[11] = 0; // alpha changed again

    const encoded = qoiEncode(pixels, w, h, 4);
    const { pixels: decoded } = qoiDecode(encoded);
    for (let i = 0; i < pixels.length; i++) {
      expect(decoded[i]).toBe(pixels[i]);
    }
  });

  it("exercises INDEX encoding for repeated colors", () => {
    // Use the same two colors alternating -- after first occurrence they should be in index
    const w = 8;
    const h = 1;
    const pixels = new Uint8Array(w * 4);
    for (let i = 0; i < w; i++) {
      const isEven = i % 2 === 0;
      pixels[i * 4] = isEven ? 200 : 50;
      pixels[i * 4 + 1] = isEven ? 100 : 150;
      pixels[i * 4 + 2] = isEven ? 50 : 200;
      pixels[i * 4 + 3] = 255;
    }

    const encoded = qoiEncode(pixels, w, h, 4);
    const { pixels: decoded } = qoiDecode(encoded);
    for (let i = 0; i < pixels.length; i++) {
      expect(decoded[i]).toBe(pixels[i]);
    }
    // With INDEX ops, the encoded size should be much smaller than raw
    expect(encoded.length).toBeLessThan(w * 5 + 14 + 8);
  });

  it("exercises maximum RUN length of 62", () => {
    // 63 identical pixels: first one is encoded, then a run of 62, then 1 more
    const w = 63;
    const h = 1;
    const pixels = new Uint8Array(w * 4);
    for (let i = 0; i < w; i++) {
      pixels[i * 4] = 77;
      pixels[i * 4 + 1] = 88;
      pixels[i * 4 + 2] = 99;
      pixels[i * 4 + 3] = 255;
    }

    const encoded = qoiEncode(pixels, w, h, 4);
    const { pixels: decoded } = qoiDecode(encoded);
    for (let i = 0; i < pixels.length; i++) {
      expect(decoded[i]).toBe(pixels[i]);
    }
  });

  it("run ending at last pixel produces correct output", () => {
    // Exactly 62 identical pixels -- run fills exactly one RUN op
    const w = 62;
    const h = 1;
    const pixels = new Uint8Array(w * 4);
    for (let i = 0; i < w; i++) {
      pixels[i * 4] = 33;
      pixels[i * 4 + 1] = 44;
      pixels[i * 4 + 2] = 55;
      pixels[i * 4 + 3] = 255;
    }

    const { pixels: decoded } = qoiDecode(qoiEncode(pixels, w, h, 4));
    for (let i = 0; i < pixels.length; i++) {
      expect(decoded[i]).toBe(pixels[i]);
    }
  });

  it("3-channel encoding uses 255 for alpha in output", () => {
    const w = 4;
    const h = 1;
    const pixels = new Uint8Array(w * 3);
    for (let i = 0; i < pixels.length; i++) {
      pixels[i] = (i * 37) & 0xff;
    }

    const encoded = qoiEncode(pixels, w, h, 3);
    const { header, pixels: decoded } = qoiDecode(encoded);
    expect(header.channels).toBe(3);
    // Every decoded pixel should have alpha=255
    for (let i = 0; i < w; i++) {
      expect(decoded[i * 4 + 3]).toBe(255);
    }
  });

  it("round-trips large image (100x100) with varied data", () => {
    const w = 100;
    const h = 100;
    const pixels = new Uint8Array(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      pixels[i * 4] = (i * 3) & 0xff;
      pixels[i * 4 + 1] = (i * 7 + 11) & 0xff;
      pixels[i * 4 + 2] = (i * 13 + 23) & 0xff;
      pixels[i * 4 + 3] = 255;
    }

    const { pixels: decoded } = qoiDecode(qoiEncode(pixels, w, h, 4));
    for (let i = 0; i < pixels.length; i++) {
      expect(decoded[i]).toBe(pixels[i]);
    }
  });

  it("handles checkerboard pattern (many INDEX lookups)", () => {
    const w = 10;
    const h = 10;
    const pixels = new Uint8Array(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const isBlack = (x + y) % 2 === 0;
        pixels[idx] = isBlack ? 0 : 255;
        pixels[idx + 1] = isBlack ? 0 : 255;
        pixels[idx + 2] = isBlack ? 0 : 255;
        pixels[idx + 3] = 255;
      }
    }

    const { pixels: decoded } = qoiDecode(qoiEncode(pixels, w, h, 4));
    for (let i = 0; i < pixels.length; i++) {
      expect(decoded[i]).toBe(pixels[i]);
    }
  });

  it("handles all-zero pixels (black with full alpha)", () => {
    const w = 5;
    const h = 5;
    const pixels = new Uint8Array(w * h * 4);
    // All zeros except alpha set to 255
    for (let i = 0; i < w * h; i++) {
      pixels[i * 4 + 3] = 255;
    }

    const { pixels: decoded } = qoiDecode(qoiEncode(pixels, w, h, 4));
    for (let i = 0; i < pixels.length; i++) {
      expect(decoded[i]).toBe(pixels[i]);
    }
  });
});
