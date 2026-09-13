// Retry one transient gateway response for read-only Data API requests.
// Auth, writes, other origins and caller-cancelled requests are never replayed.
export function createReadFetch(origin: string, baseFetch: typeof fetch = fetch): typeof fetch {
  return async (input, init) => {
    const response = await baseFetch(input, init);
    if (input instanceof Request) return response;
    const url = new URL(String(input));
    const method = (init?.method ?? "GET").toUpperCase();
    if (
      url.origin !== origin || !url.pathname.startsWith("/rest/v1/") ||
      !["GET", "HEAD"].includes(method) ||
      ![502, 503, 504].includes(response.status) || init?.signal?.aborted
    ) return response;
    // Release the failed response before making the single recovery attempt.
    await response.body?.cancel();
    await new Promise((resolve) => setTimeout(resolve, 200));
    init?.signal?.throwIfAborted();
    return baseFetch(input, init);
  };
}
