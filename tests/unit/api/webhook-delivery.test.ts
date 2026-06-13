import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("webhook delivery", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("delivers a batch of events", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    const { deliverWebhook } = await import("../../../apps/api/src/lib/webhook-delivery.js");
    const result = await deliverWebhook(
      "https://siem.example.com/input",
      "Bearer test-token",
      [{ event: "LOGIN_SUCCESS", timestamp: "2026-01-01T00:00:00Z" }],
    );

    expect(result.success).toBe(true);
    expect(result.attempts).toBe(1);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe("https://siem.example.com/input");
    expect(opts.headers["Authorization"]).toBe("Bearer test-token");
    const body = JSON.parse(opts.body);
    expect(body.source).toBe("snapotter");
    expect(body.version).toBe("1");
    expect(body.events).toHaveLength(1);
  });

  it("retries on server error", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 502 })
      .mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    const { deliverWebhook } = await import("../../../apps/api/src/lib/webhook-delivery.js");
    const result = await deliverWebhook("https://siem.example.com/input", "", [{ event: "test" }], {
      maxRetries: 3,
      initialDelayMs: 1,
    });

    expect(result.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry on 4xx client errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    vi.stubGlobal("fetch", fetchMock);

    const { deliverWebhook } = await import("../../../apps/api/src/lib/webhook-delivery.js");
    const result = await deliverWebhook("https://siem.example.com/input", "", [{ event: "test" }], {
      maxRetries: 3,
      initialDelayMs: 1,
    });

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries on network errors", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("connection refused"))
      .mockRejectedValueOnce(new Error("connection refused"))
      .mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    const { deliverWebhook } = await import("../../../apps/api/src/lib/webhook-delivery.js");
    const result = await deliverWebhook("https://siem.example.com/input", "", [{ event: "test" }], {
      maxRetries: 3,
      initialDelayMs: 1,
    });

    expect(result.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("fails after exhausting retries", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("down"));
    vi.stubGlobal("fetch", fetchMock);

    const { deliverWebhook } = await import("../../../apps/api/src/lib/webhook-delivery.js");
    const result = await deliverWebhook("https://siem.example.com/input", "", [{ event: "test" }], {
      maxRetries: 2,
      initialDelayMs: 1,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("down");
    expect(result.attempts).toBe(3); // initial + 2 retries
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("omits Authorization header when auth is empty", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    const { deliverWebhook } = await import("../../../apps/api/src/lib/webhook-delivery.js");
    await deliverWebhook("https://example.com", "", [{ event: "test" }]);

    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers["Authorization"]).toBeUndefined();
  });
});
