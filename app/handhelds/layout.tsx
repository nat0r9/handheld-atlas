import type { ReactNode } from "react";
import { createPageMetadata } from "../../lib/site";

export const metadata = createPageMetadata({
  title: "Handhelds",
  description:
    "Explore Steam Deck, ROG Ally, Legion Go and other handheld gaming PCs with specifications, presets and benchmarks.",
  pathname: "/handhelds",
});

export default function HandheldsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
