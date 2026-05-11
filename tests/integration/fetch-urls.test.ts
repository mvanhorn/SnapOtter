/**
 * Integration tests for the fetch-urls route.
 *
 * Spins up a local HTTP server to serve test fixtures, and mocks the SSRF
 * validation to allow localhost connections during tests.
 */

import { readFileSync } from "node:fs";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// SSRF private-IP checks are bypassed via the SSRF_ALLOW_PRIVATE=1 env var
// set in vitest.config.ts, so the real safeFetch works against localhost.

import { buildTestApp, loginAsAdmin, type TestApp } from "./test-server.js";

const FIXTURES = join(__dirname, "..", "fixtures");
const JPG = readFileSync(join(FIXTURES, "test-100x100.jpg"));
const TIFF = readFileSync(join(FIXTURES, "formats", "sample.tiff"));

let testApp: TestApp;
let app: TestApp["app"];
let adminToken: string;
let mockServer: Server;
let mockPort: number;

function startMockServer(): Promise<{ server: Server; port: number }> {
  return new Promise((resolve) => {
    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      const url = req.url ?? "";

      if (url === "/photo.jpg") {
        res.writeHead(200, { "Content-Type": "image/jpeg" });
        res.end(JPG);
        return;
      }

      if (url === "/not-image.txt") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("This is not an image");
        return;
      }

      if (url === "/redirect") {
        res.writeHead(302, { Location: "/photo.jpg" });
        res.end();
        return;
      }

      if (url === "/missing.jpg") {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }

      if (url === "/photo.tiff") {
        res.writeHead(200, { "Content-Type": "image/tiff" });
        res.end(TIFF);
        return;
      }

      if (url === "/empty") {
        res.writeHead(200, { "Content-Type": "image/jpeg" });
        res.end();
        return;
      }

      if (url === "/server-error") {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
        return;
      }

      if (url === "/slow-close") {
        // Return a valid response with no body stream at all
        res.writeHead(200, { "Content-Type": "image/jpeg", "Content-Length": "0" });
        res.end();
        return;
      }

      res.writeHead(404);
      res.end("Not Found");
    });

    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      resolve({ server, port });
    });
  });
}

beforeAll(async () => {
  const mock = await startMockServer();
  mockServer = mock.server;
  mockPort = mock.port;

  testApp = await buildTestApp();
  app = testApp.app;
  adminToken = await loginAsAdmin(app);
}, 30_000);

afterAll(async () => {
  await testApp.cleanup();
  await new Promise<void>((resolve) => mockServer.close(() => resolve()));
}, 10_000);

describe("POST /api/v1/fetch-urls", () => {
  it("fetches a valid image URL and returns metadata + download URL", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/fetch-urls",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: {
        urls: [`http://127.0.0.1:${mockPort}/photo.jpg`],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results).toHaveLength(1);

    const result = body.results[0];
    expect(result.success).toBe(true);
    expect(result.url).toBe(`http://127.0.0.1:${mockPort}/photo.jpg`);
    expect(result.filename).toBe("photo.jpg");
    expect(result.contentType).toBe("image/jpeg");
    expect(result.size).toBeGreaterThan(0);
    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
    expect(result.downloadUrl).toMatch(/^\/api\/v1\/download\/.+\/photo\.jpg$/);
    expect(result.previewUrl).toBeNull(); // JPEG is browser-previewable
  });

  it("returns failure for a 404 URL", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/fetch-urls",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: {
        urls: [`http://127.0.0.1:${mockPort}/missing.jpg`],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results).toHaveLength(1);

    const result = body.results[0];
    expect(result.success).toBe(false);
    expect(result.error).toContain("404");
  });

  it("returns failure for non-image content", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/fetch-urls",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: {
        urls: [`http://127.0.0.1:${mockPort}/not-image.txt`],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results).toHaveLength(1);

    const result = body.results[0];
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("handles mixed batch with successes and failures", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/fetch-urls",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: {
        urls: [
          `http://127.0.0.1:${mockPort}/photo.jpg`,
          `http://127.0.0.1:${mockPort}/missing.jpg`,
          `http://127.0.0.1:${mockPort}/not-image.txt`,
        ],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results).toHaveLength(3);

    // Results preserve order
    expect(body.results[0].success).toBe(true);
    expect(body.results[0].filename).toBe("photo.jpg");

    expect(body.results[1].success).toBe(false);
    expect(body.results[1].error).toContain("404");

    expect(body.results[2].success).toBe(false);
  });

  it("returns 400 for an empty URL array", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/fetch-urls",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: {
        urls: [],
      },
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toBeTruthy();
  });

  it("returns 400 for more than 50 URLs", async () => {
    const urls = Array.from({ length: 51 }, (_, i) => `http://example.com/img${i}.jpg`);
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/fetch-urls",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: { urls },
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toBeTruthy();
  });

  it("follows redirects to fetch the final image", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/fetch-urls",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: {
        urls: [`http://127.0.0.1:${mockPort}/redirect`],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results).toHaveLength(1);

    const result = body.results[0];
    expect(result.success).toBe(true);
    expect(result.contentType).toBe("image/jpeg");
    expect(result.size).toBe(JPG.length);
  });

  it("download URL serves the actual image", async () => {
    // First, fetch the URL to get a downloadUrl
    const fetchRes = await app.inject({
      method: "POST",
      url: "/api/v1/fetch-urls",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: {
        urls: [`http://127.0.0.1:${mockPort}/photo.jpg`],
      },
    });

    const body = JSON.parse(fetchRes.body);
    const downloadUrl = body.results[0].downloadUrl;
    expect(downloadUrl).toBeTruthy();

    // Now download the file
    const downloadRes = await app.inject({
      method: "GET",
      url: downloadUrl,
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });

    expect(downloadRes.statusCode).toBe(200);
    expect(downloadRes.headers["content-type"]).toBe("image/jpeg");
    // The downloaded buffer should match the original fixture
    expect(downloadRes.rawPayload.length).toBe(JPG.length);
  });

  it("deduplicates filenames when multiple URLs resolve to the same name", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/fetch-urls",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: {
        urls: [`http://127.0.0.1:${mockPort}/photo.jpg`, `http://127.0.0.1:${mockPort}/photo.jpg`],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results).toHaveLength(2);

    expect(body.results[0].success).toBe(true);
    expect(body.results[1].success).toBe(true);

    // Filenames must differ so one does not overwrite the other
    const names = [body.results[0].filename, body.results[1].filename];
    expect(new Set(names).size).toBe(2);
    expect(names).toContain("photo.jpg");
    expect(names).toContain("photo_1.jpg");

    // Download URLs must also differ
    expect(body.results[0].downloadUrl).not.toBe(body.results[1].downloadUrl);

    // Both download URLs should serve valid content
    for (const result of body.results) {
      const dl = await app.inject({
        method: "GET",
        url: result.downloadUrl,
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(dl.statusCode).toBe(200);
      expect(dl.rawPayload.length).toBe(JPG.length);
    }
  });

  it("returns 400 for invalid URL format", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/fetch-urls",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: {
        urls: ["not-a-valid-url"],
      },
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toBeTruthy();
  });

  it("generates a preview for non-browser-previewable formats", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/fetch-urls",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: {
        urls: [`http://127.0.0.1:${mockPort}/photo.tiff`],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results).toHaveLength(1);

    const result = body.results[0];
    expect(result.success).toBe(true);
    expect(result.contentType).toBe("image/tiff");
    expect(result.previewUrl).toBeTruthy();
    expect(result.previewUrl).toContain("preview-");
    expect(result.previewUrl).toContain(".webp");

    // Preview URL should serve a valid webp image
    const previewRes = await app.inject({
      method: "GET",
      url: result.previewUrl,
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });
    expect(previewRes.statusCode).toBe(200);
  });

  it("returns failure for empty response body", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/fetch-urls",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: {
        urls: [`http://127.0.0.1:${mockPort}/empty`],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results).toHaveLength(1);
    expect(body.results[0].success).toBe(false);
    expect(body.results[0].error).toContain("Empty");
  });

  it("returns failure for 500 server error", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/fetch-urls",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: {
        urls: [`http://127.0.0.1:${mockPort}/server-error`],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results).toHaveLength(1);
    expect(body.results[0].success).toBe(false);
    expect(body.results[0].error).toContain("500");
  });

  it("returns failure when fetch throws a network error", async () => {
    // Port 1 is almost guaranteed to refuse connections, triggering the outer
    // catch block (lines 275-278 in fetch-urls.ts).
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/fetch-urls",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: {
        urls: ["http://127.0.0.1:1/unreachable.jpg"],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results).toHaveLength(1);
    expect(body.results[0].success).toBe(false);
    expect(body.results[0].error).toBeTruthy();
  });

  it("returns failure for zero-length content", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/fetch-urls",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: {
        urls: [`http://127.0.0.1:${mockPort}/slow-close`],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results).toHaveLength(1);
    expect(body.results[0].success).toBe(false);
    expect(body.results[0].error).toContain("Empty");
  });
});
