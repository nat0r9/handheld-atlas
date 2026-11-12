import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  if (/%5c/i.test(request.nextUrl.pathname)) {
    const redirectUrl = request.nextUrl.clone();
    const normalizedPathname = request.nextUrl.pathname
      .replace(/%5c/gi, "/")
      .replace(/\/{2,}/g, "/")
      .replace(/\/+$/, "");

    redirectUrl.pathname = normalizedPathname || "/";

    return NextResponse.redirect(redirectUrl, 308);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    // Keep legacy URL corrections even for signed-out visitors.
    "/(.*%5[cC].*)",
    {
      source: "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|opengraph-image|twitter-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
      // Supabase SSR uses sb-<project>-auth-token, optionally split into .0, .1, ...
      // The matcher only selects requests for refresh; authorization stays in the routes.
      has: [{ type: "header", key: "cookie", value: "(?:.*;\\s*)?sb-[^;=]+-auth-token(?:\\.[0-9]+)?=.*" }],
    },
  ],
};
