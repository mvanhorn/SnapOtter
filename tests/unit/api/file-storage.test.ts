import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const config = vi.hoisted(() => ({
  FILES_STORAGE_PATH: "",
}));

vi.mock("../../../apps/api/src/config.js", () => ({
  env: config,
}));

let testDir: string;

beforeEach(async () => {
  testDir = join(tmpdir(), `snapotter-fs-test-${randomUUID().slice(0, 8)}`);
  await mkdir(testDir, { recursive: true });
  config.FILES_STORAGE_PATH = testDir;
  vi.resetModules();
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

async function importModule() {
  return await import("../../../apps/api/src/lib/file-storage.js");
}

describe("saveFile", () => {
  it("saves buffer and returns UUID-based filename with correct extension", async () => {
    const { saveFile } = await importModule();
    const buf = Buffer.from("fake png data");
    const name = await saveFile(buf, "photo.png");
    expect(name).toMatch(/^[0-9a-f-]{36}\.png$/);
    const saved = await readFile(join(testDir, name));
    expect(saved.toString()).toBe("fake png data");
  });

  it("sanitizes dangerous extensions to .bin", async () => {
    const { saveFile } = await importModule();
    const buf = Buffer.from("evil");
    const name = await saveFile(buf, "payload.exe");
    expect(name).toMatch(/\.bin$/);
  });

  it("uses .bin for files with no extension", async () => {
    const { saveFile } = await importModule();
    const buf = Buffer.from("data");
    const name = await saveFile(buf, "noext");
    expect(name).toMatch(/\.bin$/);
  });

  it("creates storage directory on first call", async () => {
    await rm(testDir, { recursive: true, force: true });
    const freshDir = join(tmpdir(), `snapotter-fs-fresh-${randomUUID().slice(0, 8)}`);
    config.FILES_STORAGE_PATH = freshDir;
    try {
      expect(existsSync(freshDir)).toBe(false);
      const { saveFile } = await importModule();
      await saveFile(Buffer.from("x"), "img.jpg");
      expect(existsSync(freshDir)).toBe(true);
    } finally {
      await rm(freshDir, { recursive: true, force: true });
    }
  });

  it("returns different filenames for same input (UUID-based)", async () => {
    const { saveFile } = await importModule();
    const buf = Buffer.from("same");
    const name1 = await saveFile(buf, "a.png");
    const name2 = await saveFile(buf, "a.png");
    expect(name1).not.toBe(name2);
  });

  it("accepts known image extensions", async () => {
    const { saveFile } = await importModule();
    const extensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".gif",
      ".svg",
      ".heic",
      ".tiff",
      ".avif",
    ];
    for (const ext of extensions) {
      const name = await saveFile(Buffer.from("x"), `file${ext}`);
      expect(name).toMatch(new RegExp(`\\${ext}$`));
    }
  });

  it("lowercases extensions", async () => {
    const { saveFile } = await importModule();
    const name = await saveFile(Buffer.from("x"), "PHOTO.PNG");
    expect(name).toMatch(/\.png$/);
  });
});

describe("deleteStoredFile", () => {
  it("deletes existing file", async () => {
    const { saveFile, deleteStoredFile } = await importModule();
    const name = await saveFile(Buffer.from("del"), "del.png");
    expect(existsSync(join(testDir, name))).toBe(true);
    await deleteStoredFile(name);
    expect(existsSync(join(testDir, name))).toBe(false);
  });

  it("does not throw for non-existent file", async () => {
    const { deleteStoredFile } = await importModule();
    await expect(deleteStoredFile("nonexistent.png")).resolves.toBeUndefined();
  });
});

describe("getStoredFilePath", () => {
  it("returns correct joined path", async () => {
    const { getStoredFilePath } = await importModule();
    const result = getStoredFilePath("abc-123.png");
    expect(result).toBe(join(testDir, "abc-123.png"));
  });
});

describe("ensureStorageDir", () => {
  it("creates directory if not exists", async () => {
    await rm(testDir, { recursive: true, force: true });
    const freshDir = join(tmpdir(), `snapotter-fs-ensure-${randomUUID().slice(0, 8)}`);
    config.FILES_STORAGE_PATH = freshDir;
    try {
      const { ensureStorageDir } = await importModule();
      await ensureStorageDir();
      expect(existsSync(freshDir)).toBe(true);
    } finally {
      await rm(freshDir, { recursive: true, force: true });
    }
  });

  it("is idempotent (second call does not throw)", async () => {
    const { ensureStorageDir } = await importModule();
    await ensureStorageDir();
    await expect(ensureStorageDir()).resolves.toBeUndefined();
  });
});

describe("thumbnail functions", () => {
  it("saveThumbnail creates .thumbs subdirectory", async () => {
    const { saveThumbnail } = await importModule();
    await saveThumbnail("test.png", Buffer.from("thumb"));
    expect(existsSync(join(testDir, ".thumbs"))).toBe(true);
  });

  it("saveThumbnail writes to correct path", async () => {
    const { saveThumbnail } = await importModule();
    await saveThumbnail("test.png", Buffer.from("thumb-data"));
    const content = await readFile(join(testDir, ".thumbs", "test.png.thumb.jpg"));
    expect(content.toString()).toBe("thumb-data");
  });

  it("getCachedThumbnail reads back saved thumbnail", async () => {
    const { saveThumbnail, getCachedThumbnail } = await importModule();
    const data = Buffer.from("my-thumb");
    await saveThumbnail("pic.jpg", data);
    const result = await getCachedThumbnail("pic.jpg");
    expect(result).not.toBeNull();
    expect(result?.toString()).toBe("my-thumb");
  });

  it("getCachedThumbnail returns null for non-existent thumbnail", async () => {
    const { getCachedThumbnail } = await importModule();
    const result = await getCachedThumbnail("nope.png");
    expect(result).toBeNull();
  });

  it("deleteThumbnail removes the file", async () => {
    const { saveThumbnail, deleteThumbnail } = await importModule();
    await saveThumbnail("rm.png", Buffer.from("x"));
    const thumbFile = join(testDir, ".thumbs", "rm.png.thumb.jpg");
    expect(existsSync(thumbFile)).toBe(true);
    await deleteThumbnail("rm.png");
    expect(existsSync(thumbFile)).toBe(false);
  });

  it("deleteThumbnail does not throw for non-existent", async () => {
    const { deleteThumbnail } = await importModule();
    await expect(deleteThumbnail("ghost.png")).resolves.toBeUndefined();
  });
});
