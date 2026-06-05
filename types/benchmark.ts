export interface Benchmark {
  id: string;

  gameSlug: string;
  handheldSlug: string;
  presetId: string;

  resolution: string;
  tdp: string;

  averageFps: number;
  onePercentLow: number;

  batteryLife: string;

  gameVersion: string;
  driverVersion: string;

  testedAt: string;
  tester: string;

  notes: string;
}