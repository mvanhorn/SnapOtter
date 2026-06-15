/**
 * GET /api/v1/files/:id/preview
 *
 * Server-side preview generation for non-native video/audio formats.
 * Generates a browser-playable H.264 MP4 (video) or MP3 (audio) preview
 * and caches it on disk for subsequent requests.
 */
import { createReadStream } from "node:fs";
import { access, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { runFfmpeg } from "@snapotter/media-engine";
import { eq } from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { env } from "../config.js";
import { db, schema } from "../db/index.js";
import { getStoredFilePath } from "../lib/file-storage.js";
import { hasEffectivePermission } from "../permissions.js";
import { requireAuth } from "../plugins/auth.js";

const PREVIEW_DIR = ".previews";
let previewDirReady = false;

function previewDirPath(): string {
  return join(env.FILES_STORAGE_PATH, PREVIEW_DIR);
}

async function ensurePreviewDir(): Promise<void> {
  if (previewDirReady) return;
  await mkdir(previewDirPath(), { recursive: true });
  previewDirReady = true;
}

function previewPath(fileId: string, ext: string): string {
  return join(previewDirPath(), `${fileId}${ext}`);
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function filePreviewRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/api/v1/files/:id/preview",
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const user = requireAuth(request, reply);
      if (!user) return;

      const { id } = request.params;

      const [file] = await db.select().from(schema.userFiles).where(eq(schema.userFiles.id, id));

      if (
        !file ||
        (file.userId !== user.id && !(await hasEffectivePermission(user, "files:all")))
      ) {
        return reply.status(404).send({ error: "File not found" });
      }

      const isVideo = file.mimeType.startsWith("video/");
      const isAudio = file.mimeType.startsWith("audio/");

      if (!isVideo && !isAudio) {
        return reply
          .status(400)
          .send({ error: "Preview only supported for video and audio files" });
      }

      const previewExt = isVideo ? ".mp4" : ".mp3";
      const contentType = isVideo ? "video/mp4" : "audio/mpeg";
      const cachedPath = previewPath(id, previewExt);

      // Serve from cache if available
      if (await fileExists(cachedPath)) {
        return reply
          .header("Content-Type", contentType)
          .header("Cache-Control", "public, max-age=86400, immutable")
          .send(createReadStream(cachedPath));
      }

      // Generate preview via FFmpeg
      await ensurePreviewDir();
      const inputPath = getStoredFilePath(file.storedName);

      try {
        if (isVideo) {
          await runFfmpeg([
            "-i",
            inputPath,
            "-t",
            "30",
            "-vf",
            "scale='min(720,iw)':-2",
            "-c:v",
            "libx264",
            "-preset",
            "ultrafast",
            "-crf",
            "28",
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            "-movflags",
            "+faststart",
            "-y",
            cachedPath,
          ]);
        } else {
          await runFfmpeg([
            "-i",
            inputPath,
            "-t",
            "60",
            "-c:a",
            "libmp3lame",
            "-b:a",
            "128k",
            "-y",
            cachedPath,
          ]);
        }
      } catch (err) {
        request.log.error({ err, fileId: id }, "Preview generation failed");
        return reply.status(422).send({ error: "Could not generate preview" });
      }

      return reply
        .header("Content-Type", contentType)
        .header("Cache-Control", "public, max-age=86400, immutable")
        .send(createReadStream(cachedPath));
    },
  );

  app.log.info("File preview routes registered");
}
