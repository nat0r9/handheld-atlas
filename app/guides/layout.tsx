import type { ReactNode } from "react";
import { createPageMetadata } from "../../lib/site";

export const metadata = createPageMetadata({
  title: "Handheld Gaming Guides",
  description:
    "Practical setup, troubleshooting and optimization guides for handheld gaming PCs and portable consoles.",
  pathname: "/guides",
});

export default function GuidesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
