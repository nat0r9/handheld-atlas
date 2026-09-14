// Bound read-only Data API requests, including response bodies and one gateway
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
      signal.throwIfAborted();
      let response = await baseFetch(input, options);
      signal.throwIfAborted();
      if ([502, 503, 504].includes(response.status)) {
        await response.body?.cancel();
        await new Promise((resolve) => setTimeout(resolve, 200));
        signal.throwIfAborted();
        response = await baseFetch(input, options);
      }
      // Keep the deadline alive until JSON bytes arrive, not just headers.
      const body = method === "HEAD" || [204, 205, 304].includes(response.status)
        ? null : await response.arrayBuffer();
      signal.throwIfAborted();
      return new Response(body, {
        status: response.status, statusText: response.statusText, headers: response.headers,
      });
    } finally {
      clearTimeout(timer);
    }
  };
}
