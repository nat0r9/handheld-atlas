import type { ReactNode } from "react";
import { createPageMetadata } from "../../lib/site";

export const metadata = createPageMetadata({
  title: "Compare Handhelds",
  description:
    "Compare handheld gaming PCs side by side across processors, displays, memory, battery, weight and performance data.",
  pathname: "/compare",
});

export default function CompareLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
