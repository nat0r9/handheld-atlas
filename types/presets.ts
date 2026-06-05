export type PresetType =
  | "Performance"
  | "Balanced"
  | "Battery"
  | "Docked";

export interface Preset {
  id: string;
  name: string;
  type: PresetType;

  gameSlug: string;
  handheldSlug: string;

  resolution: string;
  tdp: string;
  fpsAverage: number;

  upscaler: string;
  batteryLife: string;

  communityRating: number;
}