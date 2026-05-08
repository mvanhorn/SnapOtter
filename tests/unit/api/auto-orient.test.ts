import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { autoOrient } from "../../../apps/api/src/lib/auto-orient.js";

async function createImageWithOrientation(orientation: number): Promise<Buffer> {
  return sharp({
    create: {
      width: 100,
      height: 50,
      channels: 3,
      background: { r: 255, g: 0, b: 0 },
    },
  })
    .withMetadata({ orientation })
    .jpeg()
    .toBuffer();
}

describe("autoOrient", () => {
  it("returns original buffer unchanged when orientation is 1", async () => {
    const buf = await createImageWithOrientation(1);
    const result = await autoOrient(buf);
    const meta = await sharp(result).metadata();
    expect(meta.width).toBe(100);
    expect(meta.height).toBe(50);
  });

  it("returns original buffer unchanged when no EXIF orientation is present", async () => {
    const buf = await sharp({
      create: {
        width: 80,
        height: 60,
        channels: 3,
        background: { r: 0, g: 255, b: 0 },
      },
    })
      .png()
      .toBuffer();
    const result = await autoOrient(buf);
    const meta = await sharp(result).metadata();
    expect(meta.width).toBe(80);
    expect(meta.height).toBe(60);
  });

  it("rotates image when orientation is 6 (90 CW)", async () => {
    const buf = await createImageWithOrientation(6);
    const meta = await sharp(buf).metadata();
    expect(meta.orientation).toBe(6);
    const result = await autoOrient(buf);
    const resultMeta = await sharp(result).metadata();
    expect(resultMeta.width).toBe(50);
    expect(resultMeta.height).toBe(100);
  });

  it("rotates image when orientation is 8 (270 CW)", async () => {
    const buf = await createImageWithOrientation(8);
    const meta = await sharp(buf).metadata();
    expect(meta.orientation).toBe(8);
    const result = await autoOrient(buf);
    const resultMeta = await sharp(result).metadata();
    expect(resultMeta.width).toBe(50);
    expect(resultMeta.height).toBe(100);
  });

  it("rotates image when orientation is 3 (180)", async () => {
    const buf = await createImageWithOrientation(3);
    const meta = await sharp(buf).metadata();
    expect(meta.orientation).toBe(3);
    const result = await autoOrient(buf);
    const resultMeta = await sharp(result).metadata();
    expect(resultMeta.width).toBe(100);
    expect(resultMeta.height).toBe(50);
  });

  it("handles orientation 2 (horizontal flip)", async () => {
    const buf = await createImageWithOrientation(2);
    const origMeta = await sharp(buf).metadata();
    expect(origMeta.orientation).toBe(2);
    const result = await autoOrient(buf);
    const meta = await sharp(result).metadata();
    expect(meta.width).toBe(100);
    expect(meta.height).toBe(50);
  });

  it("strips orientation tag after rotation", async () => {
    const buf = await createImageWithOrientation(6);
    const beforeMeta = await sharp(buf).metadata();
    expect(beforeMeta.orientation).toBe(6);
    const result = await autoOrient(buf);
    const meta = await sharp(result).metadata();
    expect(meta.orientation === undefined || meta.orientation === 1).toBe(true);
  });

  it("returns original buffer for corrupted/invalid input", async () => {
    const invalid = Buffer.from("this is not an image at all");
    const result = await autoOrient(invalid);
    expect(result.equals(invalid)).toBe(true);
  });

  it("returns original buffer for empty buffer", async () => {
    const empty = Buffer.alloc(0);
    const result = await autoOrient(empty);
    expect(result.equals(empty)).toBe(true);
  });
});
