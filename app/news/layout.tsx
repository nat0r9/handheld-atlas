import type { ReactNode } from "react";
import { createPageMetadata } from "../../lib/site";

export const metadata = createPageMetadata({
  title: "Handheld Gaming News",
  description:
    "Follow handheld gaming hardware, software, performance updates and community developments without recycled filler.",
  pathname: "/news",
});

export default function NewsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
