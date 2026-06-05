import type { Guide } from "../types/guides";

export const guides: Guide[] = [
  {
    title: "How to Choose the Right TDP",
    slug: "how-to-choose-the-right-tdp",
    excerpt:
      "Learn how TDP affects performance, battery life and temperatures on handheld gaming PCs.",
    category: "Performance",
    readingTime: "5 min read",
    publishedAt: "2026-06-05",
    content: [
      "TDP controls how much power the processor can use. Higher TDP usually means more performance, but also higher temperatures and shorter battery life.",
      "For lighter games, 10W to 15W is often enough. More demanding games usually benefit from 20W to 25W.",
      "A higher TDP does not always provide a large FPS increase. The best setting is often the lowest wattage that still provides stable performance.",
      "When testing a game, increase TDP gradually and watch average FPS, 1% lows, temperatures and battery drain.",
    ],
  },
  {
    title: "Best Windows Settings for Handheld Gaming",
    slug: "best-windows-settings-for-handheld-gaming",
    excerpt:
      "Reduce background processes and improve responsiveness on Windows handheld devices.",
    category: "Windows",
    readingTime: "7 min read",
    publishedAt: "2026-06-05",
    content: [
      "Windows handhelds benefit from reducing unnecessary startup applications and background processes.",
      "Use Windows Game Mode, keep graphics drivers updated and disable overlays that you do not use.",
      "Set the display refresh rate according to your target FPS. A 60Hz mode can save battery when you do not need 120Hz.",
      "Avoid random optimization tools that promise miracle performance. Many of them simply disable useful Windows services.",
    ],
  },
  {
    title: "Handheld Battery Optimization Guide",
    slug: "handheld-battery-optimization-guide",
    excerpt:
      "Improve battery life without turning your expensive handheld into a slideshow.",
    category: "Battery",
    readingTime: "6 min read",
    publishedAt: "2026-06-05",
    content: [
      "Lowering TDP is usually the most effective way to increase battery life.",
      "Reduce display brightness, refresh rate and resolution when playing less demanding games.",
      "Limiting the frame rate to 30, 40 or 60 FPS can reduce power consumption and improve frame pacing.",
      "Wireless features, RGB lighting and background downloads can also increase battery drain.",
    ],
  },
  {
    title: "How to Build a Docked Handheld Setup",
    slug: "how-to-build-a-docked-handheld-setup",
    excerpt:
      "Connect your handheld to a monitor, keyboard, mouse and power without creating cable hell.",
    category: "Docked",
    readingTime: "8 min read",
    publishedAt: "2026-06-05",
    content: [
      "A good dock should support enough power delivery for your handheld and the display output you want to use.",
      "For 1080p gaming, HDMI 2.0 or DisplayPort is usually enough. Higher resolutions and refresh rates may require newer standards.",
      "Use the original charger or a compatible high-quality USB-C charger with sufficient wattage.",
      "Check whether your dock supports Ethernet, USB peripherals and variable refresh rate before buying.",
    ],
  },
  {
    title: "VRAM Explained for Handheld Gaming",
    slug: "vram-explained-for-handheld-gaming",
    excerpt:
      "Understand shared memory, texture settings and why more VRAM is not always automatically better.",
    category: "Hardware",
    readingTime: "6 min read",
    publishedAt: "2026-06-05",
    content: [
      "Most handheld gaming PCs use shared system memory instead of dedicated graphics memory.",
      "Allocating more VRAM can help games with high-resolution textures, but it reduces the RAM available to the operating system and game logic.",
      "For many games, automatic allocation works well. Manual settings can help in specific games that detect memory incorrectly.",
      "Do not blindly select the highest value. Test stability, loading behavior and frame pacing.",
    ],
  },
];