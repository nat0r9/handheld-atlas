import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Graphics Settings Guide",
  description:
    "Learn which PC graphics settings affect FPS, image quality, VRAM, CPU load and latency on handheld gaming devices.",
  alternates: {
    canonical: "/settings-impact",
  },
};

export default function SettingsImpactLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
