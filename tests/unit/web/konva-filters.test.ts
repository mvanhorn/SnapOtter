// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  createExposureFilter,
  createGrainFilter,
  createMotionBlurFilter,
  createSharpenFilter,
  createVibranceFilter,
  createVignetteFilter,
  createWarmthFilter,
} from "@/components/editor/konva-filters";

// ---------------------------------------------------------------------------
// Polyfill: jsdom does not provide ImageData
// ---------------------------------------------------------------------------

if (typeof globalThis.ImageData === "undefined") {
  (globalThis as Record<string, unknown>).ImageData = class ImageData {
    readonly data: Uint8ClampedArray;
    readonly width: number;
    readonly height: number;
    constructor(data: Uint8ClampedArray, width: number, height: number) {
      if (data.length !== width * height * 4) {
        throw new Error("ImageData data length mismatch");
      }
      this.data = data;
      this.width = width;
      this.height = height;
    }
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a small ImageData from flat RGBA values.
 * Every 4 entries = one pixel: [R, G, B, A, R, G, B, A, ...].
 */
function makeImageData(pixels: number[], width: number, height: number): ImageData {
  return new ImageData(new Uint8ClampedArray(pixels), width, height);
}

/** Create a uniform 4x4 image where every pixel has the same RGBA. */
function uniform4x4(r: number, g: number, b: number, a = 255): ImageData {
  const pixels: number[] = [];
  for (let i = 0; i < 16; i++) {
    pixels.push(r, g, b, a);
  }
  return makeImageData(pixels, 4, 4);
}

/** Snapshot all data bytes from an ImageData. */
function snapshot(img: ImageData): Uint8ClampedArray {
  return new Uint8ClampedArray(img.data);
}

// ===========================================================================
// createExposureFilter
// ===========================================================================

describe("createExposureFilter", () => {
  it("positive exposure brightens pixels", () => {
    const img = uniform4x4(100, 100, 100);
    const filter = createExposureFilter(0.5);
    filter(img);
    // Each channel should be brighter than the original 100
    expect(img.data[0]).toBeGreaterThan(100);
    expect(img.data[1]).toBeGreaterThan(100);
    expect(img.data[2]).toBeGreaterThan(100);
  });

  it("negative exposure darkens pixels", () => {
    const img = uniform4x4(100, 100, 100);
    const filter = createExposureFilter(-0.5);
    filter(img);
    expect(img.data[0]).toBeLessThan(100);
    expect(img.data[1]).toBeLessThan(100);
    expect(img.data[2]).toBeLessThan(100);
  });

  it("zero exposure is no-op", () => {
    const img = uniform4x4(100, 100, 100);
    const before = snapshot(img);
    const filter = createExposureFilter(0);
    filter(img);
    expect(img.data).toEqual(before);
  });

  it("does not modify alpha channel", () => {
    const img = uniform4x4(100, 100, 100, 200);
    const filter = createExposureFilter(0.5);
    filter(img);
    // Check alpha for each pixel
    for (let i = 3; i < img.data.length; i += 4) {
      expect(img.data[i]).toBe(200);
    }
  });
});

// ===========================================================================
// createVibranceFilter
// ===========================================================================

describe("createVibranceFilter", () => {
  it("positive vibrance increases saturation of dull pixels", () => {
    // A dull reddish pixel (low saturation)
    const img = makeImageData([130, 120, 110, 255], 1, 1);
    const before = snapshot(img);
    const filter = createVibranceFilter(80);
    filter(img);
    // The difference between max and min channel should increase
    const maxBefore = Math.max(before[0], before[1], before[2]);
    const minBefore = Math.min(before[0], before[1], before[2]);
    const maxAfter = Math.max(img.data[0], img.data[1], img.data[2]);
    const minAfter = Math.min(img.data[0], img.data[1], img.data[2]);
    expect(maxAfter - minAfter).toBeGreaterThanOrEqual(maxBefore - minBefore);
  });

  it("does not modify alpha channel", () => {
    const img = uniform4x4(130, 120, 110, 180);
    const filter = createVibranceFilter(50);
    filter(img);
    for (let i = 3; i < img.data.length; i += 4) {
      expect(img.data[i]).toBe(180);
    }
  });

  it("neutral gray pixels remain neutral", () => {
    // Pure gray: r=g=b, saturation is 0, so boost = amt * (1 - 0) = amt
    // but r-avg = 0 for each channel, so result = r + 0*boost = r
    const img = makeImageData([128, 128, 128, 255], 1, 1);
    const filter = createVibranceFilter(100);
    filter(img);
    expect(img.data[0]).toBe(128);
    expect(img.data[1]).toBe(128);
    expect(img.data[2]).toBe(128);
  });
});

// ===========================================================================
// createWarmthFilter
// ===========================================================================

describe("createWarmthFilter", () => {
  it("positive warmth increases red, decreases blue", () => {
    const img = uniform4x4(100, 100, 100);
    const filter = createWarmthFilter(50);
    filter(img);
    expect(img.data[0]).toBeGreaterThan(100); // red increased
    expect(img.data[2]).toBeLessThan(100); // blue decreased
  });

  it("negative warmth increases blue, decreases red", () => {
    const img = uniform4x4(100, 100, 100);
    const filter = createWarmthFilter(-50);
    filter(img);
    expect(img.data[0]).toBeLessThan(100); // red decreased
    expect(img.data[2]).toBeGreaterThan(100); // blue increased
  });

  it("does not modify green or alpha channels", () => {
    const img = uniform4x4(100, 100, 100, 200);
    const filter = createWarmthFilter(50);
    filter(img);
    for (let i = 0; i < img.data.length; i += 4) {
      expect(img.data[i + 1]).toBe(100); // green unchanged
      expect(img.data[i + 3]).toBe(200); // alpha unchanged
    }
  });
});

// ===========================================================================
// createMotionBlurFilter
// ===========================================================================

describe("createMotionBlurFilter", () => {
  it("blurs pixels in the direction of the angle", () => {
    // Create a 5x1 image with a bright pixel in the center, dark elsewhere
    // Horizontal motion blur (angle 0) should spread the bright pixel sideways
    const pixels = [0, 0, 0, 255, 0, 0, 0, 255, 200, 200, 200, 255, 0, 0, 0, 255, 0, 0, 0, 255];
    const img = makeImageData(pixels, 5, 1);
    const filter = createMotionBlurFilter({ angle: 0, distance: 5 });
    filter(img);
    // Pixels immediately adjacent to center should now be brighter (blur leaked)
    expect(img.data[1 * 4]).toBeGreaterThan(0); // pixel 1 gained brightness
    expect(img.data[3 * 4]).toBeGreaterThan(0); // pixel 3 gained brightness
  });

  it("does not throw on edge pixels", () => {
    const img = uniform4x4(128, 128, 128);
    const filter = createMotionBlurFilter({ angle: 45, distance: 10 });
    expect(() => filter(img)).not.toThrow();
  });
});

// ===========================================================================
// createVignetteFilter
// ===========================================================================

describe("createVignetteFilter", () => {
  it("darkens corner pixels more than center pixels", () => {
    const img = uniform4x4(200, 200, 200);
    const filter = createVignetteFilter({ amount: 80, midpoint: 20 });
    filter(img);
    // Corner pixel (0,0) index = 0
    const cornerR = img.data[0];
    // Center pixel -- for 4x4, "center" is at (2,2), index = (2*4+2)*4 = 40
    const centerR = img.data[40];
    // Corner should be darker (lower value)
    expect(cornerR).toBeLessThan(centerR);
  });

  it("center pixel is minimally affected", () => {
    const img = uniform4x4(200, 200, 200);
    const filter = createVignetteFilter({ amount: 50, midpoint: 50 });
    filter(img);
    // Center-ish pixel (2,2)
    const centerR = img.data[40];
    // With a high midpoint, center should stay close to original
    expect(centerR).toBeGreaterThanOrEqual(180);
  });
});

// ===========================================================================
// createGrainFilter
// ===========================================================================

describe("createGrainFilter", () => {
  it("modifies pixel values (adds noise)", () => {
    const img = uniform4x4(128, 128, 128);
    const before = snapshot(img);
    const filter = createGrainFilter({ amount: 80, size: 50 });
    filter(img);
    // At least some pixels should differ from the original due to noise
    let changed = false;
    for (let i = 0; i < img.data.length; i += 4) {
      if (img.data[i] !== before[i] || img.data[i + 1] !== before[i + 1]) {
        changed = true;
        break;
      }
    }
    expect(changed).toBe(true);
  });

  it("does not modify alpha channel", () => {
    const img = uniform4x4(128, 128, 128, 200);
    const filter = createGrainFilter({ amount: 50, size: 25 });
    filter(img);
    for (let i = 3; i < img.data.length; i += 4) {
      expect(img.data[i]).toBe(200);
    }
  });
});

// ===========================================================================
// createSharpenFilter
// ===========================================================================

describe("createSharpenFilter", () => {
  it("sharpens high-contrast edges", () => {
    // 3x3 image: dark edges with a bright center
    const pixels = [
      0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 200, 200, 200, 255, 0, 0, 0, 255, 0,
      0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255,
    ];
    const img = makeImageData(pixels, 3, 3);
    const filter = createSharpenFilter({ amount: 100, radius: 1 });
    filter(img);
    // The center pixel should remain bright or get brighter due to sharpening
    // (unsharp mask enhances the difference from the blur)
    const centerIdx = (1 * 3 + 1) * 4;
    expect(img.data[centerIdx]).toBeGreaterThanOrEqual(200);
  });

  it("does not modify alpha channel", () => {
    const img = uniform4x4(128, 128, 128, 180);
    const filter = createSharpenFilter({ amount: 50, radius: 1 });
    filter(img);
    for (let i = 3; i < img.data.length; i += 4) {
      expect(img.data[i]).toBe(180);
    }
  });
});
