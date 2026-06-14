import type { FastifyInstance } from "fastify";
import { db } from "../../db/index.js";
import { jobs } from "../../db/schema.js";
import { sql } from "drizzle-orm";

const DEFAULT_POPULAR = [
  "resize", "crop", "compress", "convert", "remove-background",
  "upscale", "merge-pdf", "watermark-text", "compress-video",
  "trim-video", "convert-audio", "compress-pdf",
];

export async function registerPopularTools(app: FastifyInstance) {
  app.get("/api/v1/tools/popular", async () => {
    try {
      const rows = await db
        .select({
          toolId: jobs.toolId,
          count: sql<number>`count(*)`.as("count"),
        })
        .from(jobs)
        .groupBy(jobs.toolId)
        .orderBy(sql`count(*) desc`)
        .limit(12);

      if (rows.length < 4) {
        return { tools: DEFAULT_POPULAR };
      }
      return { tools: rows.map((r) => r.toolId) };
    } catch {
      return { tools: DEFAULT_POPULAR };
    }
  });
}
