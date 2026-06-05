export type HandheldStatus = "Current" | "Upcoming" | "Discontinued";

export interface Handheld {
  name: string;
  slug: string;
  manufacturer: string;
  status: HandheldStatus;

  operatingSystem: string;
  processor: string;
  memory: string;
  storage: string;

  displaySize: string;
  resolution: string;
  refreshRate: string;

  battery: string;
  weight: string;
}