/**
 * Expanded format detection tests covering uncovered magic byte branches:
 * - CR3 (Canon ISOBMFF RAW with ftyp "crx ")
 * - DPX reverse byte order
 * - Cineon
 * - Fujifilm RAF
 * - Sigma X3F
 * - Minolta MRW
 * - RIFF with buffer too short for WEBP check
 * - AVIF ftyp with buffer exactly 12 bytes (edge case)
 * - CR3 ftyp with buffer too short
 */
import { detectFormat } from "@snapotter/image-engine";
import { describe, expect, it } from "vitest";

describe("detectFormat expanded magic byte branches", () => {
  it("detects CR3 magic bytes (ftyp at offset 4 with crx brand)", async () => {
    const buf = Buffer.alloc(16);
    // ftyp at offset 4
    buf[4] = 0x66;
    buf[5] = 0x74;
    buf[6] = 0x79;
    buf[7] = 0x70;
    // brand "crx " at offset 8
    buf[8] = 0x63;
    buf[9] = 0x72;
    buf[10] = 0x78;
    buf[11] = 0x20;
    const format = await detectFormat(buf);
    expect(format).toBe("cr3");
  });

  it("rejects ftyp box with non-CR3 brand when CR3 entry is checked", async () => {
    const buf = Buffer.alloc(16);
    buf[4] = 0x66;
    buf[5] = 0x74;
    buf[6] = 0x79;
    buf[7] = 0x70;
    // "mp41" brand -- not AVIF and not CR3
    buf[8] = 0x6d;
    buf[9] = 0x70;
    buf[10] = 0x34;
    buf[11] = 0x31;
    const format = await detectFormat(buf);
    // Should not be cr3 or avif
    expect(format).not.toBe("cr3");
    expect(format).not.toBe("avif");
  });

  it("rejects CR3 ftyp when buffer is too short for brand (< 12 bytes)", async () => {
    const buf = Buffer.alloc(8);
    buf[4] = 0x66;
    buf[5] = 0x74;
    buf[6] = 0x79;
    buf[7] = 0x70;
    const format = await detectFormat(buf);
    expect(format).not.toBe("cr3");
  });

  it("detects DPX reverse byte order magic bytes", async () => {
    const buf = Buffer.from([0x58, 0x50, 0x44, 0x53, 0, 0, 0, 0, 0, 0, 0, 0]);
    const format = await detectFormat(buf);
    expect(format).toBe("dpx");
  });

  it("detects Cineon magic bytes", async () => {
    const buf = Buffer.from([0x80, 0x2a, 0x5f, 0xd7, 0, 0, 0, 0, 0, 0, 0, 0]);
    const format = await detectFormat(buf);
    expect(format).toBe("cin");
  });

  it("detects Fujifilm RAF magic bytes", async () => {
    // "FUJIFILMCCD-RAW" = 15 bytes
    const signature = Buffer.from("FUJIFILMCCD-RAW", "ascii");
    const buf = Buffer.alloc(20);
    signature.copy(buf, 0);
    const format = await detectFormat(buf);
    expect(format).toBe("raf");
  });

  it("detects Sigma X3F magic bytes (FOVb)", async () => {
    const buf = Buffer.from([0x46, 0x4f, 0x56, 0x62, 0, 0, 0, 0, 0, 0, 0, 0]);
    const format = await detectFormat(buf);
    expect(format).toBe("x3f");
  });

  it("detects Minolta MRW magic bytes", async () => {
    const buf = Buffer.from([0x00, 0x4d, 0x52, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0]);
    const format = await detectFormat(buf);
    expect(format).toBe("mrw");
  });

  it("RIFF header in 8-byte buffer is handled (Sharp may detect or magic bytes skip)", async () => {
    // RIFF header in only 8 bytes -- the WEBP magic byte check requires 12 bytes,
    // but Sharp's metadata() may still detect it as webp from the RIFF header alone.
    const buf = Buffer.alloc(8);
    buf[0] = 0x52;
    buf[1] = 0x49;
    buf[2] = 0x46;
    buf[3] = 0x46;
    const format = await detectFormat(buf);
    // Sharp may report "webp" from the RIFF header, or magic bytes may skip it.
    // Either way the function should not throw.
    expect(typeof format).toBe("string");
  });

  it("detects AVIF ftyp with exactly 12-byte buffer (minimum for brand check)", async () => {
    const buf = Buffer.alloc(12);
    buf[4] = 0x66;
    buf[5] = 0x74;
    buf[6] = 0x79;
    buf[7] = 0x70;
    buf[8] = 0x61;
    buf[9] = 0x76;
    buf[10] = 0x69;
    buf[11] = 0x66;
    const format = await detectFormat(buf);
    expect(format).toBe("avif");
  });

  it("buffer with only magic byte prefix but too short for full match returns unknown", async () => {
    // PNG magic needs 4 bytes but buffer is only 3
    const buf = Buffer.from([0x89, 0x50, 0x4e]);
    const format = await detectFormat(buf);
    expect(format).toBe("unknown");
  });

  it("buffer with ICO-like bytes but too short", async () => {
    // ICO needs 4 bytes: 00 00 01 00
    const buf = Buffer.from([0x00, 0x00, 0x01]);
    const format = await detectFormat(buf);
    expect(format).toBe("unknown");
  });

  it("two-byte buffer matching only first two bytes of a 4-byte signature", async () => {
    // BMP starts with 0x42 0x4D (2 bytes) but needs at least 2 for match
    const buf = Buffer.from([0x42, 0x4d]);
    const format = await detectFormat(buf);
    expect(format).toBe("bmp");
  });

  it("FITS magic needs 6 bytes, 5-byte buffer is too short", async () => {
    const buf = Buffer.from([0x53, 0x49, 0x4d, 0x50, 0x4c]);
    const format = await detectFormat(buf);
    expect(format).toBe("unknown");
  });

  it("EPS ASCII magic needs 10 bytes, 9-byte buffer is too short", async () => {
    const buf = Buffer.from([0x25, 0x21, 0x50, 0x53, 0x2d, 0x41, 0x64, 0x6f, 0x62]);
    const format = await detectFormat(buf);
    expect(format).toBe("unknown");
  });
});
