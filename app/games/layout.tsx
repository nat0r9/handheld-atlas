import type { ReactNode } from "react";
import { createPageMetadata } from "../../lib/site";

export const metadata = createPageMetadata({
  title: "Games",
  description:
    "Browse handheld-ready games with Atlas Scores, community ratings, tested presets and measured performance data.",
  pathname: "/games",
});

export default function GamesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
