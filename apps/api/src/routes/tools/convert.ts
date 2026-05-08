import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import { promisify } from "node:util";
import { convert } from "@snapotter/image-engine";
import type { FastifyInstance } from "fastify";
import sharp from "sharp";
import { z } from "zod";
import { encodeHeic } from "../../lib/heic-converter.js";
import { isSvgBuffer } from "../../lib/svg-sanitize.js";
import { createToolRoute } from "../tool-factory.js";

const execFileAsync = promisify(execFile);

let cachedMagickCmd: string | null = null;

async function findMagickCmd(): Promise<string> {
  if (cachedMagickCmd) return cachedMagickCmd;
  for (const cmd of ["magick", "convert"]) {
    try {
      await execFileAsync(cmd, ["--version"], { timeout: 5_000 });
      cachedMagickCmd = cmd;
      return cmd;
    } catch {
      // try next
    }
  }
  throw new Error("No ImageMagick found. Install imagemagick (provides convert/magick).");
}

function magickArgs(cmd: string, args: string[]): string[] {
  return cmd === "magick" ? ["convert", ...args] : args;
}

const FORMAT_CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  tiff: "image/tiff",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  psd: "image/vnd.adobe.photoshop",
};

const settingsSchema = z.object({
  format: z.enum(["jpg", "png", "webp", "avif", "tiff", "gif", "heic", "heif", "psd"]),
  quality: z.number().min(1).max(100).optional(),
});

export function registerConvert(app: FastifyInstance) {
  createToolRoute(app, {
    toolId: "convert",
    settingsSchema,
    process: async (inputBuffer, settings, filename) => {
      const sharpOpts = isSvgBuffer(inputBuffer) ? { density: 300 } : undefined;
      const image = sharp(inputBuffer, sharpOpts);

      let buffer: Buffer;
      if (settings.format === "psd") {
        const pngBuffer = await image.png().toBuffer();
        const id = randomUUID();
        const inputPath = join(tmpdir(), `psd-enc-in-${id}.png`);
        const outputPath = join(tmpdir(), `psd-enc-out-${id}.psd`);
        try {
          await writeFile(inputPath, pngBuffer);
          const cmd = await findMagickCmd();
          await execFileAsync(cmd, magickArgs(cmd, [inputPath, `psd:${outputPath}`]), {
            timeout: 120_000,
          });
          buffer = await readFile(outputPath);
        } finally {
          await rm(inputPath, { force: true }).catch(() => {});
          await rm(outputPath, { force: true }).catch(() => {});
        }
      } else if (settings.format === "heic" || settings.format === "heif") {
        const pngBuffer = await image.png().toBuffer();
        buffer = await encodeHeic(pngBuffer, settings.quality);
      } else {
        const result = await convert(image, settings as Parameters<typeof convert>[1]);
        buffer = await result.toBuffer();
      }

      // Change filename extension to match the output format
      const ext = extname(filename);
      const baseName = ext ? filename.slice(0, -ext.length) : filename;
      const outputFilename = `${baseName}.${settings.format}`;

      const contentType = FORMAT_CONTENT_TYPES[settings.format] || "application/octet-stream";

      return { buffer, filename: outputFilename, contentType };
    },
  });
}
