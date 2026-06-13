import type { Metadata, Viewport } from "next";
import AnalyticsConsent from "../components/AnalyticsConsent";
import Footer from "../components/Footer";
import Header from "../components/Header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.handheldatlas.com"),

  title: {
    default:
      "HandheldAtlas — Handheld Gaming Settings, Benchmarks and Guides",
    template: "%s | HandheldAtlas",
  },

  description:
    "Handheld gaming settings, performance presets, verified benchmarks, device comparisons, guides and news for Steam Deck, ROG Ally, Legion Go and more.",

  applicationName: "HandheldAtlas",

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
      name: "HandheldAtlas",
    },
  ],

  creator: "HandheldAtlas",
  publisher: "HandheldAtlas",

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
    url: "https://www.handheldatlas.com",
    siteName: "HandheldAtlas",
    title:
      "HandheldAtlas — Handheld Gaming Settings, Benchmarks and Guides",
    description:
      "Tested settings, real benchmarks, handheld profiles, guides and news without the usual filler.",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "HandheldAtlas",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title:
      "HandheldAtlas — Handheld Gaming Settings, Benchmarks and Guides",
    description:
      "Tested settings, real benchmarks, handheld profiles, guides and news without the usual filler.",
    images: ["/icon-512.png"],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-slate-950">
      <body className="min-h-screen bg-slate-950 text-white antialiased">
        <div className="flex min-h-screen flex-col">
          <Header />

          <div className="flex-1 pt-[4.5rem]">
            {children}
          </div>

          <Footer />
        </div>

        <AnalyticsConsent
          measurementId="G-Z4145QK694"
        />
      </body>
    </html>
  );
}