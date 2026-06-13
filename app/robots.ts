import type { MetadataRoute } from "next";

const baseUrl =
  "https://www.handheldatlas.com";

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
          "/search",
        ],
      },
    ],

    sitemap:
      `${baseUrl}/sitemap.xml`,

    host: baseUrl,
  };
}
