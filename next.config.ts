import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // HandheldAtlas stores many game covers and device images as external URLs.
    // Keeping Next/Vercel optimization on for large catalogs burns the free
    // image-transformation quota quickly, so the site serves images directly.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
