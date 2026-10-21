// Bound read-only Data API requests, including response bodies and one gateway/transport
// retry. Auth, writes and other origins retain their normal fetch behavior.
export function createReadFetch(
  origin: string,
  baseFetch: typeof fetch = fetch,
  timeoutMs = 12_000,
): typeof fetch {
  return async (input, init) => {
    if (input instanceof Request) return baseFetch(input, init);
    const url = new URL(String(input));
    const method = (init?.method ?? "GET").toUpperCase();
    if (url.origin !== origin || !url.pathname.startsWith("/rest/v1/") ||
        !["GET", "HEAD"].includes(method)) return baseFetch(input, init);
    const deadline = new AbortController();
    const signal = init?.signal
      ? AbortSignal.any([init.signal, deadline.signal])
      : deadline.signal;
    // AbortError prevents the SDK from restarting an expired request budget.
    const timer = setTimeout(() => deadline.abort(
      new DOMException("Database read exceeded its time limit", "AbortError"),
    ), timeoutMs);
    const options = { ...init, signal };
    try {
      for (let attempt = 0; ; attempt++) {
        signal.throwIfAborted();
        try {
          const response = await baseFetch(input, options);
          signal.throwIfAborted();
          if (attempt === 0 && [502, 503, 504].includes(response.status)) {
            await response.body?.cancel();
          } else {
            // Transport failures can also happen after headers arrive.
            const body = method === "HEAD" || [204, 205, 304].includes(response.status)
              ? null : await response.arrayBuffer();
            signal.throwIfAborted();
            return new Response(body, {
              status: response.status, statusText: response.statusText, headers: response.headers,
            });
          }
        } catch (error) {
          signal.throwIfAborted();
          if (!isTransientTransportError(error)) throw error;
          if (attempt > 0) {
            // PostgREST retries thrown network errors itself. Mark this exhausted
            // budget as aborted so it cannot start another pair of attempts.
            const exhausted = new Error("Database read retry budget exhausted", { cause: error });
            exhausted.name = "AbortError";
            throw exhausted;
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    } finally {
      clearTimeout(timer);
    }
  };
}

function isTransientTransportError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const failure = error as { name?: string; code?: string; cause?: { code?: string } };
  if (failure.name === "AbortError") return false;
  const code = failure.cause?.code ?? failure.code;
  return ["UND_ERR_SOCKET", "ETIMEDOUT", "ECONNRESET", "EPIPE",
    "UND_ERR_CONNECT_TIMEOUT", "UND_ERR_HEADERS_TIMEOUT", "UND_ERR_BODY_TIMEOUT"].includes(code ?? "");
}
