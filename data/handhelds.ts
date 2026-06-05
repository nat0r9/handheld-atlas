import type { Handheld } from "../types/handheld";

export const handhelds: Handheld[] = [
  {
    name: "ROG Ally X",
    slug: "rog-ally-x",
    manufacturer: "ASUS",
    status: "Current",

    operatingSystem: "Windows 11",
    processor: "AMD Ryzen Z1 Extreme",
    memory: "24 GB LPDDR5X",
    storage: "1 TB NVMe SSD",

    displaySize: "7 inch",
    resolution: "1920 × 1080",
    refreshRate: "120 Hz VRR",

    battery: "80 Wh",
    weight: "678 g",
  },
  {
    name: "Steam Deck OLED",
    slug: "steam-deck-oled",
    manufacturer: "Valve",
    status: "Current",

    operatingSystem: "SteamOS",
    processor: "AMD Custom APU",
    memory: "16 GB LPDDR5",
    storage: "512 GB / 1 TB NVMe SSD",

    displaySize: "7.4 inch OLED",
    resolution: "1280 × 800",
    refreshRate: "90 Hz",

    battery: "50 Wh",
    weight: "640 g",
  },
  {
    name: "Legion Go",
    slug: "legion-go",
    manufacturer: "Lenovo",
    status: "Current",

    operatingSystem: "Windows 11",
    processor: "AMD Ryzen Z1 Extreme",
    memory: "16 GB LPDDR5X",
    storage: "512 GB / 1 TB NVMe SSD",

    displaySize: "8.8 inch",
    resolution: "2560 × 1600",
    refreshRate: "144 Hz",

    battery: "49.2 Wh",
    weight: "854 g",
  },
  {
    name: "ROG Xbox Ally X",
    slug: "rog-xbox-ally-x",
    manufacturer: "ASUS / Xbox",
    status: "Current",

    operatingSystem: "Windows 11 with Xbox Full Screen Experience",
    processor: "AMD Ryzen AI Z2 Extreme",
    memory: "24 GB LPDDR5X",
    storage: "1 TB NVMe SSD",

    displaySize: "7 inch",
    resolution: "1920 × 1080",
    refreshRate: "120 Hz VRR",

    battery: "80 Wh",
    weight: "715 g",
  },
];