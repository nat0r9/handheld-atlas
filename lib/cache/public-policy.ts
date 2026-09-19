// Only these anonymous reads may enter the shared Next.js Data Cache.
export const PUBLIC_CACHE_SECONDS = 600;
export const PUBLIC_TABLES = ["games", "handhelds", "benchmarks", "presets", "news", "guides"] as const;
const publicRpcs: Record<string, string[]> = {
  get_game_rating_summaries: ["games"],
  get_monthly_top_games: ["games"],
};
export function publicReadTags(url: URL, method: string, headers: Headers, origin: string, key: string): string[] {
  if (url.origin !== origin || !["GET", "HEAD"].includes(method.toUpperCase()) ||
      headers.has("cookie") || headers.get("apikey") !== key ||
      (headers.has("authorization") && headers.get("authorization") !== `Bearer ${key}`)) return [];
  const resource = url.pathname.replace(/^\/rest\/v1\//, "");
  if (!url.pathname.startsWith("/rest/v1/")) return [];
  const rpcName = resource.startsWith("rpc/") ? resource.slice(4) : "";
  const rpcTags = Object.hasOwn(publicRpcs, rpcName) ? publicRpcs[rpcName] : undefined;
  if (rpcTags) return rpcTags.map((table) => `atlas:${table}`);
  if (!PUBLIC_TABLES.some((table) => table === resource) || url.searchParams.get("status") !== "eq.published") return [];
  const select = url.searchParams.get("select") ?? "";
  // Joined labels and counts must be refreshed when their source changes too.
  const dependencies = PUBLIC_TABLES.filter((table) =>
    table === resource || new RegExp(`\\b${table}\\s*[!(]`).test(select));
  return dependencies.map((table) => `atlas:${table}`);
}
export function publicPathTags(path: string): string[] {
  const section = path.split("/")[1];
  return PUBLIC_TABLES.some((table) => table === section) ? [`atlas:${section}`] : [];
}
