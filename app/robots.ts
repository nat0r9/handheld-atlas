import type { MetadataRoute } from "next";
import { siteConfig } from "../lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // HTML pages that should stay out of search expose a noindex meta tag.
      // Blocking those pages here would prevent crawlers from seeing it.
      disallow: ["/api", "/api/", "/auth", "/auth/"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
