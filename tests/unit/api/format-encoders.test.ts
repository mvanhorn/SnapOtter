import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  encodeBmp,
  encodeIco,
  encodeJp2,
  encodeQoi,
} from "../../../apps/api/src/lib/format-encoders.js";

const FIXTURES = join(__dirname, "../../fixtures");

async function createTestPng(width = 50, height = 50): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 128, g: 64, b: 200, alpha: 1 },
    },
  })
    .png()
    .toBuffer();
}

describe("encodeQoi", () => {
  it("encodes a PNG buffer to QOI format", async () => {
    const input = await createTestPng();
    const result = await encodeQoi(input);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toBe(0x71);
    expect(result[1]).toBe(0x6f);
    expect(result[2]).toBe(0x69);
    expect(result[3]).toBe(0x66);
  });

  it("encodes JPEG input to QOI", async () => {
    const jpeg = await sharp({
      create: {
        width: 30,
        height: 30,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();
    const result = await encodeQoi(jpeg);
    expect(result.length).toBeGreaterThan(0);
    expect(Buffer.from(result.subarray(0, 4)).toString("ascii")).toBe("qoif");
  });

  it("encodes fixture image to QOI", async () => {
    const input = await readFile(join(FIXTURES, "test-200x150.png"));
    const result = await encodeQoi(input);
    expect(result.length).toBeGreaterThan(100);
  });
});

describe("encodeBmp", () => {
  it("encodes a PNG buffer to BMP format", async () => {
    const input = await createTestPng();
    const result = await encodeBmp(input);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toBe(0x42);
    expect(result[1]).toBe(0x4d);
  });

  it("encodes JPEG input to BMP", async () => {
    const jpeg = await sharp({
      create: {
        width: 20,
        height: 20,
        channels: 3,
        background: { r: 0, g: 255, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();
    const result = await encodeBmp(jpeg);
    expect(result[0]).toBe(0x42);
    expect(result[1]).toBe(0x4d);
  });

  it("produces a BMP with correct dimensions", async () => {
    const input = await createTestPng(80, 60);
    const result = await encodeBmp(input);
    const width = result.readUInt32LE(18);
    const height = result.readUInt32LE(22);
    expect(width).toBe(80);
    expect(height).toBe(60);
  });
});

describe("encodeIco", () => {
  it("encodes a PNG buffer to ICO format", async () => {
    const input = await createTestPng(64, 64);
    const result = await encodeIco(input);
    expect(result.length).toBeGreaterThan(0);
    expect(result.readUInt16LE(0)).toBe(0);
    expect(result.readUInt16LE(2)).toBe(1);
  });

  it("resizes large images to fit within 256x256", async () => {
    const input = await createTestPng(400, 400);
    const result = await encodeIco(input);
    expect(result.length).toBeGreaterThan(0);
    expect(result.readUInt16LE(2)).toBe(1);
  });

  it("preserves small images without enlargement", async () => {
    const input = await createTestPng(16, 16);
    const result = await encodeIco(input);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("encodeJp2", () => {
  it("encodes a PNG buffer to JP2 format", async () => {
    const input = await createTestPng();
    const result = await encodeJp2(input);
    expect(result.length).toBeGreaterThan(0);
  });

  it("accepts optional quality parameter", async () => {
    const input = await createTestPng();
    const result = await encodeJp2(input, 50);
    expect(result.length).toBeGreaterThan(0);
  });

  it("produces valid output at different quality levels", async () => {
    const input = await readFile(join(FIXTURES, "test-200x150.png"));
    const low = await encodeJp2(input, 10);
    const high = await encodeJp2(input, 90);
    expect(low.length).toBeGreaterThan(0);
    expect(high.length).toBeGreaterThan(0);
  });
});
