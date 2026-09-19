import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createReadFetch } from "./read-fetch";
import { PUBLIC_CACHE_SECONDS, publicReadTags } from "../cache/public-policy";

// No cookies, user session, service-role key or persistent auth state.
// This client is exclusively for published, public content reads.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Missing public Supabase configuration");
  const origin = new URL(url).origin;
  const read = createReadFetch(origin);
  const publicFetch: typeof fetch = (input, init) => {
    if (input instanceof Request) throw new Error("Public reads require a URL");
    const method = (init?.method ?? "GET").toUpperCase();
    if (!["GET", "HEAD"].includes(method)) throw new Error("Public client is read-only");
    const tags = publicReadTags(new URL(String(input)), method, new Headers(init?.headers), origin, key);
    return read(input, tags.length
      ? { ...init, cache: "force-cache", next: { revalidate: PUBLIC_CACHE_SECONDS, tags } }
      : { ...init, cache: "no-store" });
  };
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: publicFetch },
  });
}
