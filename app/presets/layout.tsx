import type { ReactNode } from "react";
import { createPageMetadata } from "../../lib/site";

export const metadata = createPageMetadata({
  title: "Handheld Game Presets",
  description:
    "Find tested performance, balanced, battery and docked settings with FPS, 1% lows, TDP targets and community proof.",
  pathname: "/presets",
});

export default function PresetsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
