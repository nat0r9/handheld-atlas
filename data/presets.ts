import type { Preset } from "../types/presets";

export const presets: Preset[] = [
  {
    id: "cyberpunk-rog-ally-x-balanced",
    name: "Balanced 60 FPS",
    type: "Balanced",

    gameSlug: "cyberpunk-2077",
    handheldSlug: "rog-ally-x",

    resolution: "1080p",
    tdp: "25W",
    fpsAverage: 62,

    upscaler: "FSR Quality",
    batteryLife: "1h 45m",

    communityRating: 4.8,
  },
  {
    id: "cyberpunk-rog-ally-x-performance",
    name: "Performance Mode",
    type: "Performance",

    gameSlug: "cyberpunk-2077",
    handheldSlug: "rog-ally-x",

    resolution: "900p",
    tdp: "30W",
    fpsAverage: 76,

    upscaler: "FSR Balanced",
    batteryLife: "1h 15m",

    communityRating: 4.6,
  },
  {
    id: "cyberpunk-rog-ally-x-battery",
    name: "Battery Saver",
    type: "Battery",

    gameSlug: "cyberpunk-2077",
    handheldSlug: "rog-ally-x",

    resolution: "720p",
    tdp: "15W",
    fpsAverage: 42,

    upscaler: "FSR Balanced",
    batteryLife: "2h 30m",

    communityRating: 4.3,
  },
  {
    id: "cyberpunk-rog-ally-x-docked",
    name: "Docked 1080p",
    type: "Docked",

    gameSlug: "cyberpunk-2077",
    handheldSlug: "rog-ally-x",

    resolution: "1080p",
    tdp: "30W",
    fpsAverage: 68,

    upscaler: "FSR Quality",
    batteryLife: "Connected to power",

    communityRating: 4.7,
  },
];