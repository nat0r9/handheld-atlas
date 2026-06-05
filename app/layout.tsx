import type { Metadata } from "next";
import Header from "../components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "HandheldAtlas",
    template: "%s | HandheldAtlas",
  },
  description:
    "Find the best settings, benchmarks, TDP profiles and battery presets for handheld gaming devices.",
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

        <div className="pt-16">{children}</div>
      </body>
    </html>
  );
}