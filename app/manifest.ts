import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HandheldAtlas",
    short_name: "HandheldAtlas",

    description:
      "Handheld gaming settings, performance presets, benchmarks, device comparisons, guides and news.",

    start_url: "/",
    scope: "/",

    display: "standalone",

    background_color: "#020617",
    theme_color: "#020617",

    orientation: "portrait-primary",

    categories: [
      "games",
      "utilities",
      "entertainment",
    ],

    lang: "en",

    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],

    shortcuts: [
      {
        name: "Find game settings",
        short_name: "Presets",
        description:
          "Browse tested handheld performance presets.",
        url: "/presets",
      },
      {
        name: "Compare handhelds",
        short_name: "Compare",
        description:
          "Compare handheld specifications side by side.",
        url: "/compare",
      },
      {
        name: "Search HandheldAtlas",
        short_name: "Search",
        description:
          "Search games, handhelds, guides and news.",
        url: "/search",
      },
    ],
  };
}