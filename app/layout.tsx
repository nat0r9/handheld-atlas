import type { Metadata, Viewport } from "next";
import AnalyticsConsent from "../components/AnalyticsConsent";
import Footer from "../components/Footer";
import Header from "../components/Header";
import JsonLd from "../components/JsonLd";
import { siteConfig } from "../lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default:
      "HandheldAtlas — Handheld Gaming Settings, Benchmarks and Guides",
    template: "%s | HandheldAtlas",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "handheld gaming",
    "Steam Deck settings",
    "ROG Ally settings",
    "Legion Go settings",
    "handheld benchmarks",
    "gaming presets",
    "handheld guides",
  ],
  authors: [
    {
      name: siteConfig.name,
      url: siteConfig.url,
    },
  ],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: "gaming",
  alternates: {
    canonical: siteConfig.url,
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      {
        url: "/icon-192.png",
        type: "image/png",
        sizes: "192x192",
      },
      {
        url: "/icon-512.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        type: "image/png",
        sizes: "180x180",
      },
    ],
    shortcut: [
      {
        url: "/icon-192.png",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title:
      "HandheldAtlas — Handheld Gaming Settings, Benchmarks and Guides",
    description:
      "Tested settings, real benchmarks, handheld profiles, guides and news without the usual filler.",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "HandheldAtlas — Handheld Gaming Settings, Benchmarks and Guides",
    description:
      "Tested settings, real benchmarks, handheld profiles, guides and news without the usual filler.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
  themeColor: "#020617",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${siteConfig.url}/#organization`,
  name: siteConfig.name,
  url: siteConfig.url,
  logo: `${siteConfig.url}/icon-512.png`,
  email: siteConfig.email,
  sameAs: [
    siteConfig.socials.discord,
    siteConfig.socials.instagram,
    siteConfig.socials.x,
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteConfig.url}/#website`,
  url: siteConfig.url,
  name: siteConfig.name,
  description: siteConfig.description,
  publisher: {
    "@id": `${siteConfig.url}/#organization`,
  },
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteConfig.url}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-slate-950">
      <body className="min-h-screen bg-slate-950 text-white antialiased">
        <JsonLd data={[organizationJsonLd, websiteJsonLd]} />

        <a
          href="#main-content"
          className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-lg bg-cyan-400 px-4 py-3 font-black text-slate-950 shadow-xl transition focus:translate-y-0"
        >
          Skip to content
        </a>

        <div className="flex min-h-screen flex-col">
          <Header />

          <div id="main-content" className="flex-1 pt-[4.5rem]" tabIndex={-1}>
            {children}
          </div>

          <Footer />
        </div>

        <AnalyticsConsent measurementId="G-Z4145QK694" />
      </body>
    </html>
  );
}
