import type { Benchmark } from "../types/benchmark";

export const benchmarks: Benchmark[] = [
  {
    id: "cyberpunk-rog-ally-x-balanced-benchmark",

    gameSlug: "cyberpunk-2077",
    handheldSlug: "rog-ally-x",
    presetId: "cyberpunk-rog-ally-x-balanced",

    resolution: "1080p",
    tdp: "25W",

    averageFps: 62,
    onePercentLow: 48,

    batteryLife: "1h 45m",

    gameVersion: "2.2",
    driverVersion: "AMD Adrenalin",

    testedAt: "2026-06-05",
    tester: "HandheldAtlas",

    notes: "Stable balanced preset with good image quality.",
  },
  {
    id: "cyberpunk-rog-ally-x-performance-benchmark",

    gameSlug: "cyberpunk-2077",
    handheldSlug: "rog-ally-x",
    presetId: "cyberpunk-rog-ally-x-performance",

    resolution: "900p",
    tdp: "30W",

    averageFps: 76,
    onePercentLow: 59,

    batteryLife: "1h 15m",

    gameVersion: "2.2",
    driverVersion: "AMD Adrenalin",

    testedAt: "2026-06-05",
    tester: "HandheldAtlas",

    notes: "Higher frame rate with reduced image quality.",
  },
  {
    id: "cyberpunk-rog-ally-x-battery-benchmark",

    gameSlug: "cyberpunk-2077",
    handheldSlug: "rog-ally-x",
    presetId: "cyberpunk-rog-ally-x-battery",

    resolution: "720p",
    tdp: "15W",

    averageFps: 42,
    onePercentLow: 34,

    batteryLife: "2h 30m",

    gameVersion: "2.2",
    driverVersion: "AMD Adrenalin",

    testedAt: "2026-06-05",
    tester: "HandheldAtlas",

    notes: "Best battery life, but lower visual quality.",
  },
  {
    id: "cyberpunk-rog-ally-x-docked-benchmark",

    gameSlug: "cyberpunk-2077",
    handheldSlug: "rog-ally-x",
    presetId: "cyberpunk-rog-ally-x-docked",

    resolution: "1080p",
    tdp: "30W",

    averageFps: 68,
    onePercentLow: 54,

    batteryLife: "Connected to power",

    gameVersion: "2.2",
    driverVersion: "AMD Adrenalin",

    testedAt: "2026-06-05",
    tester: "HandheldAtlas",

    notes: "Stable docked performance for external displays.",
  },
];