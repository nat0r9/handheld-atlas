import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createReadFetch } from "./read-fetch";

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL in .env.local",
    );
  }

  if (!supabasePublishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local",
    );
  }

  return createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      global: { fetch: createReadFetch(new URL(supabaseUrl).origin) },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(
              ({ name, value, options }) => {
                cookieStore.set(name, value, options);
              },
            );
          } catch {
            /*
             * Nastavení cookies může selhat při vykreslování
             * běžné Server Component. Později přidáme proxy,
             * která bude obnovovat přihlašovací session.
             */
          }
        },
      },
    },
  );
}
