import type { ReactNode } from "react";
import { createPageMetadata } from "../../lib/site";

export const metadata = createPageMetadata({
  title: "Handheld Gaming Benchmarks",
  description:
    "Compare measured average FPS, 1% lows, power targets and battery estimates across games and handheld devices.",
  pathname: "/benchmarks",
});

export default function BenchmarksLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
