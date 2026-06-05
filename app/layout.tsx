import type { Metadata } from "next";
import Footer from "../components/Footer";
import Header from "../components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "HandheldAtlas",
    template: "%s | HandheldAtlas",
  },
  description:
    "Find handheld gaming settings, presets, benchmarks, comparisons and practical guides.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white antialiased">
        <Header />

        <div className="min-h-screen pt-16">
          {children}
        </div>

        <Footer />
      </body>
    </html>
  );
}