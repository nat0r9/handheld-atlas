import type { Game } from "../types/game";

export const games: Game[] = [
  {
    name: "Cyberpunk 2077",
    slug: "cyberpunk-2077",
    genre: "RPG",
    atlasScore: 91,

    releaseYear: 2020,
    developer: "CD Projekt Red",

    bestHandheld: "ROG Ally X",
    recommendedTDP: "25W",

    notes: "Excellent handheld experience with FSR.",
  },
  {
    name: "Diablo IV",
    slug: "diablo-iv",
    genre: "ARPG",
    atlasScore: 88,

    releaseYear: 2023,
    developer: "Blizzard",

    bestHandheld: "ROG Ally X",
    recommendedTDP: "20W",

    notes: "Runs very well at 60 FPS.",
  },
  {
    name: "Path of Exile 2",
    slug: "path-of-exile-2",
    genre: "ARPG",
    atlasScore: 90,

    releaseYear: 2024,
    developer: "Grinding Gear Games",

    bestHandheld: "ROG Ally X",
    recommendedTDP: "25W",

    notes: "Heavy CPU load during endgame.",
  },
  {
    name: "Elden Ring",
    slug: "elden-ring",
    genre: "Action RPG",
    atlasScore: 92,

    releaseYear: 2022,
    developer: "FromSoftware",

    bestHandheld: "Steam Deck OLED",
    recommendedTDP: "15W",

    notes: "Excellent performance and battery balance.",
  },
];