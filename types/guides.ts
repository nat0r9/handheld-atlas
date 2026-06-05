export type GuideCategory =
  | "Performance"
  | "Battery"
  | "Docked"
  | "Windows"
  | "Hardware";

export interface Guide {
  title: string;
  slug: string;
  excerpt: string;
  category: GuideCategory;
  readingTime: string;
  publishedAt: string;
  content: string[];
}