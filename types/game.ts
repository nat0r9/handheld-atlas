export interface Game {
  name: string;
  slug: string;
  genre: string;
  atlasScore: number;

  releaseYear: number;
  developer: string;

  bestHandheld: string;
  recommendedTDP: string;

  notes: string;
  coverImage: string;
}