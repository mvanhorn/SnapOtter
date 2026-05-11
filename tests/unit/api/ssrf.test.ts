import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { MAX_REDIRECTS, safeFetch, validateFetchUrl } from "../../../apps/api/src/lib/ssrf.js";

describe("validateFetchUrl", () => {
  it("allows valid public HTTP URL", async () => {
    await expect(
      validateFetchUrl("https://images.unsplash.com/photo.jpg"),
    ).resolves.toBeUndefined();
  });

  it("allows valid public HTTP URL without TLS", async () => {
    await expect(validateFetchUrl("http://example.com/image.png")).resolves.toBeUndefined();
  });

  it("rejects non-HTTP schemes", async () => {
    await expect(validateFetchUrl("ftp://example.com/image.jpg")).rejects.toThrow(
      "Only HTTP and HTTPS",
    );
    await expect(validateFetchUrl("file:///etc/passwd")).rejects.toThrow("Only HTTP and HTTPS");
    await expect(validateFetchUrl("data:image/png;base64,abc")).rejects.toThrow(
      "Only HTTP and HTTPS",
    );
  });

  it("rejects localhost and loopback", async () => {
    await expect(validateFetchUrl("http://127.0.0.1/image.jpg")).rejects.toThrow("private");
    await expect(validateFetchUrl("http://localhost/image.jpg")).rejects.toThrow("private");
    await expect(validateFetchUrl("http://[::1]/image.jpg")).rejects.toThrow("private");
  });

  it("rejects private network ranges", async () => {
    await expect(validateFetchUrl("http://10.0.0.1/image.jpg")).rejects.toThrow("private");
    await expect(validateFetchUrl("http://172.16.0.1/image.jpg")).rejects.toThrow("private");
    await expect(validateFetchUrl("http://192.168.1.1/image.jpg")).rejects.toThrow("private");
  });

  it("rejects link-local addresses", async () => {
    await expect(validateFetchUrl("http://169.254.169.254/latest/meta-data/")).rejects.toThrow(
      "private",
    );
  });

  it("rejects CG-NAT range (100.64.0.0/10)", async () => {
    await expect(validateFetchUrl("http://100.64.0.1/image.jpg")).rejects.toThrow("private");
    await expect(validateFetchUrl("http://100.127.255.255/image.jpg")).rejects.toThrow("private");
  });

  it("rejects IETF protocol assignments (192.0.0.0/24)", async () => {
    await expect(validateFetchUrl("http://192.0.0.1/image.jpg")).rejects.toThrow("private");
  });

  it("rejects benchmarking range (198.18.0.0/15)", async () => {
    await expect(validateFetchUrl("http://198.18.0.1/image.jpg")).rejects.toThrow("private");
    await expect(validateFetchUrl("http://198.19.255.255/image.jpg")).rejects.toThrow("private");
  });

  it("rejects reserved/class E range (240.0.0.0/4)", async () => {
    await expect(validateFetchUrl("http://240.0.0.1/image.jpg")).rejects.toThrow("private");
    await expect(validateFetchUrl("http://255.255.255.255/image.jpg")).rejects.toThrow("private");
  });

  it("rejects IPv6 unspecified address", async () => {
    await expect(validateFetchUrl("http://[::]/image.jpg")).rejects.toThrow("private");
  });

  it("rejects IPv6 documentation range (2001:db8::/32)", async () => {
    await expect(validateFetchUrl("http://[2001:db8::1]/image.jpg")).rejects.toThrow("private");
    await expect(validateFetchUrl("http://[2001:DB8::1]/image.jpg")).rejects.toThrow("private");
  });

  it("rejects invalid URLs", async () => {
    await expect(validateFetchUrl("not-a-url")).rejects.toThrow();
    await expect(validateFetchUrl("")).rejects.toThrow();
  });
});

describe("safeFetch", () => {
  let mockFetch: Mock;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
  });

  function mockResponse(status: number, headers?: Record<string, string>): Response {
    return {
      status,
      headers: new Headers(headers),
      body: { cancel: vi.fn() },
    } as unknown as Response;
  }

  it("returns response for a direct (non-redirect) fetch", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200));
    const res = await safeFetch("https://example.com/image.jpg");
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("follows a redirect chain within MAX_REDIRECTS", async () => {
    // 3 redirects then a 200
    mockFetch
      .mockResolvedValueOnce(mockResponse(302, { location: "https://example.com/hop1" }))
      .mockResolvedValueOnce(mockResponse(301, { location: "https://example.com/hop2" }))
      .mockResolvedValueOnce(mockResponse(307, { location: "https://example.com/final" }))
      .mockResolvedValueOnce(mockResponse(200));

    const res = await safeFetch("https://example.com/start");
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  it("throws when redirect chain exceeds MAX_REDIRECTS", async () => {
    // Return redirects for every call (MAX_REDIRECTS + 1 iterations, all redirects)
    for (let i = 0; i <= MAX_REDIRECTS; i++) {
      mockFetch.mockResolvedValueOnce(
        mockResponse(302, { location: `https://example.com/hop${i + 1}` }),
      );
    }

    await expect(safeFetch("https://example.com/start")).rejects.toThrow("Too many redirects");
  });

  it("rejects a redirect to a private IP", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(302, { location: "http://127.0.0.1/evil" }));

    await expect(safeFetch("https://example.com/image.jpg")).rejects.toThrow("private");
  });

  it("throws when redirect has no Location header", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(302));

    await expect(safeFetch("https://example.com/image.jpg")).rejects.toThrow(
      "Redirect without Location header",
    );
  });
});
