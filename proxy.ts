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
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|opengraph-image|twitter-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
