/**
 * Expanded MIME mapping tests covering every extension and MIME type
 * in the EXT_TO_MIME and MIME_TO_EXT tables that were not previously tested.
 */
import { extToMime, formatToExt, formatToMime, mimeToExt } from "@snapotter/image-engine";
import { describe, expect, it } from "vitest";

describe("extToMime expanded mappings", () => {
  const cases: Array<[string, string]> = [
    // RAW camera formats
    ["cr3", "image/x-canon-cr3"],
    ["raf", "image/x-fuji-raf"],
    ["pef", "image/x-pentax-pef"],
    ["3fr", "image/x-hasselblad-3fr"],
    ["iiq", "image/x-phaseone-iiq"],
    ["srw", "image/x-samsung-srw"],
    ["x3f", "image/x-sigma-x3f"],
    ["rwl", "image/x-leica-rwl"],
    ["nrw", "image/x-nikon-nrw"],
    ["gpr", "image/x-gopro-gpr"],
    ["fff", "image/x-hasselblad-fff"],
    ["mrw", "image/x-minolta-mrw"],
    ["mef", "image/x-mamiya-mef"],
    ["kdc", "image/x-kodak-kdc"],
    ["dcr", "image/x-kodak-dcr"],
    ["erf", "image/x-epson-erf"],
    ["ptx", "image/x-pentax-ptx"],
    // JPEG 2000 variants
    ["jp2", "image/jp2"],
    ["j2k", "image/jp2"],
    ["j2c", "image/jp2"],
    ["jpc", "image/jp2"],
    ["jpf", "image/jp2"],
    ["jpx", "image/jpx"],
    // Other formats
    ["qoi", "image/qoi"],
    ["eps", "application/postscript"],
    ["epsf", "application/postscript"],
    ["dds", "image/vnd.ms-dds"],
    ["cur", "image/x-icon"],
    ["apng", "image/apng"],
    ["dpx", "image/x-dpx"],
    ["cin", "image/x-cineon"],
    ["fits", "image/fits"],
    ["fit", "image/fits"],
    ["fts", "image/fits"],
    ["ppm", "image/x-portable-pixmap"],
    ["pgm", "image/x-portable-graymap"],
    ["pbm", "image/x-portable-bitmap"],
    ["pnm", "image/x-portable-anymap"],
    ["pam", "image/x-portable-anymap"],
    ["pfm", "image/x-portable-floatmap"],
    ["svgz", "image/svg+xml"],
  ];

  for (const [ext, mime] of cases) {
    it(`maps "${ext}" to "${mime}"`, () => {
      expect(extToMime(ext)).toBe(mime);
    });
  }

  it("handles mixed case for exotic extensions", () => {
    expect(extToMime("CR3")).toBe("image/x-canon-cr3");
    expect(extToMime("RAF")).toBe("image/x-fuji-raf");
    expect(extToMime("DDS")).toBe("image/vnd.ms-dds");
    expect(extToMime("SVGZ")).toBe("image/svg+xml");
  });

  it("strips leading dot for exotic extensions", () => {
    expect(extToMime(".cr3")).toBe("image/x-canon-cr3");
    expect(extToMime(".qoi")).toBe("image/qoi");
    expect(extToMime(".dpx")).toBe("image/x-dpx");
  });
});

describe("mimeToExt expanded mappings", () => {
  const cases: Array<[string, string]> = [
    ["image/x-canon-cr3", "cr3"],
    ["image/x-fuji-raf", "raf"],
    ["image/x-pentax-pef", "pef"],
    ["image/x-hasselblad-3fr", "3fr"],
    ["image/x-phaseone-iiq", "iiq"],
    ["image/x-samsung-srw", "srw"],
    ["image/x-sigma-x3f", "x3f"],
    ["image/x-leica-rwl", "rwl"],
    ["image/x-nikon-nrw", "nrw"],
    ["image/x-gopro-gpr", "gpr"],
    ["image/x-hasselblad-fff", "fff"],
    ["image/x-minolta-mrw", "mrw"],
    ["image/x-mamiya-mef", "mef"],
    ["image/x-kodak-kdc", "kdc"],
    ["image/x-kodak-dcr", "dcr"],
    ["image/x-epson-erf", "erf"],
    ["image/x-pentax-ptx", "ptx"],
    ["image/jp2", "jp2"],
    ["image/jpx", "jpx"],
    ["image/qoi", "qoi"],
    ["application/postscript", "eps"],
    ["image/vnd.ms-dds", "dds"],
    ["image/apng", "apng"],
    ["image/x-dpx", "dpx"],
    ["image/x-cineon", "cin"],
    ["image/fits", "fits"],
    ["image/x-portable-pixmap", "ppm"],
    ["image/x-portable-graymap", "pgm"],
    ["image/x-portable-bitmap", "pbm"],
    ["image/x-portable-anymap", "pnm"],
    ["image/x-portable-floatmap", "pfm"],
  ];

  for (const [mime, ext] of cases) {
    it(`maps "${mime}" to "${ext}"`, () => {
      expect(mimeToExt(mime)).toBe(ext);
    });
  }

  it("handles uppercase MIME for exotic types", () => {
    expect(mimeToExt("IMAGE/X-CANON-CR3")).toBe("cr3");
    expect(mimeToExt("IMAGE/QOI")).toBe("qoi");
  });
});

describe("formatToMime expanded", () => {
  it("maps 'heif' to 'image/heif'", () => {
    expect(formatToMime("heif")).toBe("image/heif");
  });

  it("maps 'jxl' to 'image/jxl'", () => {
    expect(formatToMime("jxl")).toBe("image/jxl");
  });

  it("maps 'bmp' to 'image/bmp'", () => {
    expect(formatToMime("bmp")).toBe("image/bmp");
  });

  it("maps 'ico' to 'image/x-icon'", () => {
    expect(formatToMime("ico")).toBe("image/x-icon");
  });

  it("handles mixed case for jpeg", () => {
    expect(formatToMime("JPEG")).toBe("image/jpeg");
    expect(formatToMime("Jpeg")).toBe("image/jpeg");
  });

  it("handles mixed case for non-jpeg format", () => {
    expect(formatToMime("PNG")).toBe("image/png");
    expect(formatToMime("WebP")).toBe("image/webp");
  });
});

describe("formatToExt expanded", () => {
  it("maps non-jpeg formats to lowercase identity", () => {
    expect(formatToExt("avif")).toBe("avif");
    expect(formatToExt("heif")).toBe("heif");
    expect(formatToExt("jxl")).toBe("jxl");
    expect(formatToExt("svg")).toBe("svg");
  });

  it("handles mixed case consistently", () => {
    expect(formatToExt("TIFF")).toBe("tiff");
    expect(formatToExt("Gif")).toBe("gif");
    expect(formatToExt("AVIF")).toBe("avif");
  });

  it("passes through truly unknown format strings", () => {
    expect(formatToExt("raw")).toBe("raw");
    expect(formatToExt("nef")).toBe("nef");
  });
});
