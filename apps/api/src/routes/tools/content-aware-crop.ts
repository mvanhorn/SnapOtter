import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { outpaint } from "@snapotter/ai";
import { getBundleForTool, TOOL_BUNDLE_MAP } from "@snapotter/shared";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import sharp from "sharp";
import { z } from "zod";
import { autoOrient } from "../../lib/auto-orient.js";
import { formatZodErrors } from "../../lib/errors.js";
import { isToolInstalled } from "../../lib/feature-status.js";
import { validateImageBuffer } from "../../lib/file-validation.js";
import { sanitizeFilename } from "../../lib/filename.js";
import { decodeToSharpCompat, needsCliDecode } from "../../lib/format-decoders.js";
import { encodeJxl } from "../../lib/format-encoders.js";
import { decodeHeic, encodeHeic } from "../../lib/heic-converter.js";
import { resolveOutputFormat } from "../../lib/output-format.js";
import { createWorkspace } from "../../lib/workspace.js";
import { updateSingleFileProgress } from "../progress.js";
import { registerToolProcessFn } from "../tool-factory.js";

const EXT_MAP: Record<string, string> = {
  jpeg: "jpg",
  jpg: "jpg",
  png: "png",
  webp: "webp",
  tiff: "tiff",
  gif: "gif",
  avif: "avif",
  heic: "heic",
  heif: "heif",
  jxl: "jxl",
};

const BROWSER_PREVIEWABLE = new Set(["png", "jpg", "jpeg", "webp", "gif", "avif", "bmp"]);

const settingsSchema = z.object({
  extendTop: z.number().int().min(0).default(0),
  extendRight: z.number().int().min(0).default(0),
  extendBottom: z.number().int().min(0).default(0),
  extendLeft: z.number().int().min(0).default(0),
  format: z
    .enum(["auto", "png", "jpg", "jpeg", "webp", "tiff", "gif", "avif", "heic", "heif", "jxl"])
    .default("auto"),
  quality: z.number().int().min(1).max(100).default(95),
});

type Settings = z.infer<typeof settingsSchema>;

/**
 * Content-aware crop (outpainting) route.
 * Extends image borders using AI-powered outpainting via LaMa.
 */
export function registerContentAwareCrop(app: FastifyInstance) {
  app.post(
    "/api/v1/tools/content-aware-crop",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const toolId = "content-aware-crop";
      if (!isToolInstalled(toolId)) {
        const bundle = getBundleForTool(toolId);
        return reply.status(501).send({
          error: "Feature not installed",
          code: "FEATURE_NOT_INSTALLED",
          feature: TOOL_BUNDLE_MAP[toolId],
          featureName: bundle?.name ?? toolId,
          estimatedSize: bundle?.estimatedSize ?? "unknown",
        });
      }

      let fileBuffer: Buffer | null = null;
      let filename = "image";
      let settingsRaw: string | null = null;
      let clientJobId: string | null = null;

      try {
        const parts = request.parts();
        for await (const part of parts) {
          if (part.type === "file") {
            const chunks: Buffer[] = [];
            for await (const chunk of part.file) {
              chunks.push(chunk);
            }
            fileBuffer = Buffer.concat(chunks);
            filename = sanitizeFilename(part.filename ?? "image");
          } else if (part.fieldname === "settings") {
            settingsRaw = part.value as string;
          } else if (part.fieldname === "clientJobId") {
            const raw = part.value as string;
            if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)) {
              clientJobId = raw;
            }
          }
        }
      } catch (err) {
        return reply.status(400).send({
          error: "Failed to parse multipart request",
          details: err instanceof Error ? err.message : String(err),
        });
      }

      if (!fileBuffer || fileBuffer.length === 0) {
        return reply.status(400).send({ error: "No image file provided" });
      }

      const validation = await validateImageBuffer(fileBuffer, filename);
      if (!validation.valid) {
        return reply.status(400).send({ error: `Invalid image: ${validation.reason}` });
      }

      // Validate settings
      let settings: Settings;
      try {
        const raw = settingsRaw ? JSON.parse(settingsRaw) : {};
        const result = settingsSchema.safeParse(raw);
        if (!result.success) {
          return reply
            .status(400)
            .send({ error: "Invalid settings", details: formatZodErrors(result.error.issues) });
        }
        settings = result.data;
      } catch {
        return reply.status(400).send({ error: "Settings must be valid JSON" });
      }

      // At least one extend direction must be > 0
      if (
        settings.extendTop === 0 &&
        settings.extendRight === 0 &&
        settings.extendBottom === 0 &&
        settings.extendLeft === 0
      ) {
        return reply.status(400).send({
          error: "At least one extend direction must be greater than 0",
        });
      }

      let format: string = settings.format;
      let quality = settings.quality;

      if (format === "auto") {
        const detected = await resolveOutputFormat(fileBuffer, filename);
        format = detected.format === "jpeg" ? "jpg" : detected.format;
        quality = detected.quality;
      }

      try {
        // Decode HEIC/HEIF input
        if (validation.format === "heif") {
          fileBuffer = await decodeHeic(fileBuffer);
        }

        // Decode CLI-decoded formats (RAW, TGA, PSD, EXR, HDR)
        if (needsCliDecode(validation.format)) {
          fileBuffer = await decodeToSharpCompat(fileBuffer, validation.format);
        }

        // Auto-orient to fix EXIF rotation
        fileBuffer = await autoOrient(fileBuffer);
      } catch (err) {
        request.log.error({ err, toolId: "content-aware-crop" }, "Input decoding failed");
        return reply.status(422).send({
          error: "Content-aware crop failed",
          details: err instanceof Error ? err.message : "Unknown error",
        });
      }

      const originalSize = fileBuffer.length;
      const jobId = randomUUID();
      const progressJobId = clientJobId || jobId;
      let workspacePath: string;
      try {
        workspacePath = await createWorkspace(jobId);
        const inputPath = join(workspacePath, "input", filename);
        await writeFile(inputPath, fileBuffer);
      } catch (err) {
        request.log.error({ err, toolId: "content-aware-crop" }, "Workspace creation failed");
        return reply.status(422).send({
          error: "Content-aware crop failed",
          details: err instanceof Error ? err.message : "Unknown error",
        });
      }

      const log = request.log;
      log.info(
        {
          toolId: "content-aware-crop",
          imageSize: originalSize,
          extendTop: settings.extendTop,
          extendRight: settings.extendRight,
          extendBottom: settings.extendBottom,
          extendLeft: settings.extendLeft,
          format,
        },
        "Starting content-aware crop",
      );

      // Reply immediately so the HTTP connection closes within proxy timeout limits.
      // The result will be delivered via the SSE progress channel.
      reply.status(202).send({ jobId: progressJobId, async: true });

      const onProgress = (percent: number, stage: string) => {
        updateSingleFileProgress({
          jobId: progressJobId,
          phase: "processing",
          stage,
          percent,
        });
      };

      // Fire-and-forget: processing happens after the response is sent
      (async () => {
        const resultBuffer = await outpaint(
          fileBuffer,
          {
            extendTop: settings.extendTop,
            extendRight: settings.extendRight,
            extendBottom: settings.extendBottom,
            extendLeft: settings.extendLeft,
          },
          join(workspacePath, "output"),
          onProgress,
        );

        // Convert to the requested output format using Sharp
        const needsNodeConversion = ["heic", "heif", "avif", "jxl"].includes(format);
        let outputBuffer: Buffer;
        let finalFormat = format;

        if (needsNodeConversion) {
          if (format === "heic" || format === "heif") {
            outputBuffer = await encodeHeic(resultBuffer, quality);
            finalFormat = format;
          } else if (format === "jxl") {
            outputBuffer = await encodeJxl(resultBuffer, quality);
            finalFormat = "jxl";
          } else {
            outputBuffer = await sharp(resultBuffer).avif({ quality }).toBuffer();
            finalFormat = "avif";
          }
        } else if (format === "jpg" || format === "jpeg") {
          outputBuffer = await sharp(resultBuffer).jpeg({ quality }).toBuffer();
          finalFormat = "jpg";
        } else if (format === "webp") {
          outputBuffer = await sharp(resultBuffer).webp({ quality }).toBuffer();
          finalFormat = "webp";
        } else if (format === "tiff") {
          outputBuffer = await sharp(resultBuffer).tiff({ quality }).toBuffer();
          finalFormat = "tiff";
        } else if (format === "gif") {
          outputBuffer = await sharp(resultBuffer).gif().toBuffer();
          finalFormat = "gif";
        } else {
          outputBuffer = resultBuffer;
          finalFormat = "png";
        }

        // Save output
        const ext = EXT_MAP[finalFormat] || "png";
        const outputFilename = `${filename.replace(/\.[^.]+$/, "")}_extended.${ext}`;
        const outputPath = join(workspacePath, "output", outputFilename);
        await writeFile(outputPath, outputBuffer);

        // Generate browser-compatible preview for non-previewable formats
        let previewUrl: string | undefined;
        if (!BROWSER_PREVIEWABLE.has(finalFormat)) {
          try {
            const previewInput =
              finalFormat === "heic" || finalFormat === "heif"
                ? await decodeHeic(outputBuffer)
                : outputBuffer;
            const previewBuffer = await sharp(previewInput).webp({ quality: 80 }).toBuffer();
            const previewPath = join(workspacePath, "output", "preview.webp");
            await writeFile(previewPath, previewBuffer);
            previewUrl = `/api/v1/download/${jobId}/preview.webp`;
          } catch {
            // Non-fatal - frontend will show fallback
          }
        }

        const downloadUrl = `/api/v1/download/${jobId}/${encodeURIComponent(outputFilename)}`;
        updateSingleFileProgress({
          jobId: progressJobId,
          phase: "complete",
          percent: 100,
          result: {
            jobId,
            downloadUrl,
            previewUrl,
            originalSize,
            processedSize: outputBuffer.length,
          },
        });

        log.info(
          { toolId: "content-aware-crop", jobId, downloadUrl },
          "Content-aware crop complete",
        );
      })().catch((err) => {
        log.error({ err, toolId: "content-aware-crop" }, "Content-aware crop failed");
        updateSingleFileProgress({
          jobId: progressJobId,
          phase: "failed",
          percent: 0,
          error: err instanceof Error ? err.message : "Content-aware crop failed",
        });
      });
    },
  );

  // Register in the pipeline/batch registry so this tool can be used
  // as a step in automation pipelines (without progress callbacks).
  registerToolProcessFn({
    toolId: "content-aware-crop",
    settingsSchema,
    process: async (inputBuffer, settings, filename) => {
      const s = settings as Settings;

      // Decode HEIC/HEIF for pipeline/batch mode
      const ext = filename.split(".").pop()?.toLowerCase() ?? "";
      let buf = inputBuffer;
      if (["heic", "heif", "hif"].includes(ext)) {
        buf = await decodeHeic(buf);
      }
      // Decode CLI-decoded formats for pipeline/batch mode
      const cliCheck = await validateImageBuffer(inputBuffer, filename);
      if (cliCheck.valid && needsCliDecode(cliCheck.format)) {
        buf = await decodeToSharpCompat(inputBuffer, cliCheck.format);
      }

      const orientedBuffer = await autoOrient(buf);
      const jobId = randomUUID();
      const workspacePath = await createWorkspace(jobId);

      const resultBuffer = await outpaint(
        orientedBuffer,
        {
          extendTop: s.extendTop,
          extendRight: s.extendRight,
          extendBottom: s.extendBottom,
          extendLeft: s.extendLeft,
        },
        join(workspacePath, "output"),
      );

      const outputFilename = `${filename.replace(/\.[^.]+$/, "")}_extended.png`;
      return { buffer: resultBuffer, filename: outputFilename, contentType: "image/png" };
    },
  });
}
