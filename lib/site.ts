import type { Metadata } from "next";

export const siteConfig = {
  name: "HandheldAtlas",
  url: "https://www.handheldatlas.com",
  description:
    "Handheld gaming presets, graphics settings impact guides, verified benchmarks, device comparisons, guides and news for Steam Deck, ROG Ally, Legion Go and more.",
  shortDescription:
    "Tested handheld settings, measured performance and community knowledge.",
  email: "handheldatlas@gmail.com",
  socials: {
    discord: "https://discord.gg/RdafdpbTXd",
    instagram: "https://www.instagram.com/handheld_atlas",
    x: "https://x.com/handheldatlas",
  },
} as const;

export function absoluteUrl(pathname = "/") {
  if (/^https?:\/\//i.test(pathname)) {
    return pathname;
  }

  return new URL(pathname, siteConfig.url).toString();
}

interface PageMetadataOptions {
  title: string;
  description: string;
  pathname: string;
  image?: string | null;
  type?: "website" | "article";
  noIndex?: boolean;
}

export function createPageMetadata({
  title,
  description,
  pathname,
  image,
  type = "website",
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const canonical = absoluteUrl(pathname);
  const socialImage = image ? absoluteUrl(image) : absoluteUrl("/opengraph-image");

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
        }
      : undefined,
    openGraph: {
      type,
      url: canonical,
      siteName: siteConfig.name,
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [
        {
          url: socialImage,
          width: 1200,
          height: 630,
          alt: `${title} — ${siteConfig.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [socialImage],
    },
  };
}
