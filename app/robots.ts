import type { MetadataRoute } from "next";
import { siteConfig } from "../lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api",
          "/api/",
          "/auth",
          "/auth/",
          "/login",
          "/register",
          "/profile",
          "/my-submissions",
          "/my-submissions/",
          "/my-guide-submissions",
          "/my-guide-submissions/",
          "/supabase-test",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
