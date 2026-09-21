export interface RecentBenchmarkGame {
  handheldSlug: string;
  gameSlug: string;
  gameName: string;
  addedAt: string;
  resultCount: number;
}

type Input = {
  id: string;
  published_at: string | null;
  games: { name: string; slug: string } | null;
  handhelds: { slug: string } | null;
};

// Build a small public payload once during ISR, not on every visitor request.
// One card per game prevents bulk imports of power profiles crowding out other games.
export function recentBenchmarkGames(rows: Input[], publishedDevices: string[]): RecentBenchmarkGame[] {
  const allowed = new Set(publishedDevices);
  const seen = new Set<string>();
  const groups = new Map<string, RecentBenchmarkGame>();
  for (const row of rows) {
    if (!row.games || !row.handhelds || !allowed.has(row.handhelds.slug) || seen.has(row.id)) continue;
    seen.add(row.id);
    const key = JSON.stringify([row.handhelds.slug, row.games.slug]);
    const timestamp = row.published_at ? Date.parse(row.published_at) : NaN;
    const addedAt = Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : "";
    const current = groups.get(key);
    if (current) {
      current.resultCount++;
      if (addedAt > current.addedAt) current.addedAt = addedAt;
    } else {
      groups.set(key, { handheldSlug: row.handhelds.slug, gameSlug: row.games.slug,
        gameName: row.games.name, addedAt, resultCount: 1 });
    }
  }
  const counts = new Map<string, number>();
  return [...groups.values()]
    .filter((g) => g.addedAt)
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt) || a.gameSlug.localeCompare(b.gameSlug) || a.handheldSlug.localeCompare(b.handheldSlug))
    .filter((g) => {
      const count = counts.get(g.handheldSlug) ?? 0;
      counts.set(g.handheldSlug, count + 1);
      return count < 3;
    });
}
