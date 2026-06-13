interface DeliveryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  timeoutMs?: number;
}

interface DeliveryResult {
  success: boolean;
  statusCode?: number;
  error?: string;
  attempts: number;
}

export async function deliverWebhook(
  url: string,
  authHeader: string,
  events: Record<string, unknown>[],
  options: DeliveryOptions = {},
): Promise<DeliveryResult> {
  const { maxRetries = 3, initialDelayMs = 1000, timeoutMs = 30_000 } = options;

  const payload = JSON.stringify({
    source: "snapotter",
    version: "1",
    events,
  });

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authHeader) headers["Authorization"] = authHeader;

  let lastError: string | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = initialDelayMs * 2 ** (attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: payload,
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (response.ok) {
        return { success: true, statusCode: response.status, attempts: attempt + 1 };
      }

      lastError = `HTTP ${response.status}`;
      // Don't retry 4xx errors (client errors = won't succeed on retry)
      if (response.status >= 400 && response.status < 500) {
        return { success: false, statusCode: response.status, error: lastError, attempts: attempt + 1 };
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  return { success: false, error: lastError, attempts: maxRetries + 1 };
}
