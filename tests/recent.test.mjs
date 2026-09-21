import test from "node:test";
import assert from "node:assert/strict";
import { recentBenchmarkGames } from "../lib/catalog/recent.ts";

const row = (id, game, device, date) => ({ id, games: { name: game, slug: game }, handhelds: { slug: device }, published_at: date });
test("bulk profiles become one game card, retaining counts and the latest addition date", () => {
  const first = row("a", "cyberpunk", "deck", "2026-09-01T12:00:00Z");
  const results = recentBenchmarkGames([first, first,
    row("b", "cyberpunk", "deck", "2026-09-10T12:00:00Z"),
    row("c", "f1", "deck", "2026-09-12T12:00:00Z"),
    row("d", "cyberpunk", "ally", "2026-09-15T12:00:00Z")], ["deck", "ally"]);
  assert.deepEqual(results.filter((g) => g.handheldSlug === "deck").map((g) => g.gameSlug), ["f1", "cyberpunk"]);
  assert.equal(results.find((g) => g.handheldSlug === "deck" && g.gameSlug === "cyberpunk").resultCount, 2);
  assert.equal(results.find((g) => g.handheldSlug === "ally").resultCount, 1);
});
test("missing dates are not presented as fresh, missing joins and unpublished devices are omitted", () => {
  const rows = [row("a", "unknown", "deck", null), row("b", "invalid", "deck", "bad-date"),
    row("c", "hidden", "draft-device", "2026-09-20"),
    { ...row("d", "missing", "deck", "2026-09-20"), games: null }];
  assert.deepEqual(recentBenchmarkGames(rows, ["deck"]), []);
});
test("each device has at most three games, selected by date independent of input order", () => {
  const rows = ["deck", "ally"].flatMap((device) => [1, 2, 3, 4].map((day) => row(`${device}${day}`, `game-${day}`, device, `2026-09-0${day}`)));
  const result = recentBenchmarkGames(rows, ["deck", "ally"]);
  assert.equal(result.length, 6);
  assert.deepEqual(result, recentBenchmarkGames([...rows].reverse(), ["deck", "ally"]));
  assert.deepEqual(result.filter((g) => g.handheldSlug === "deck").map((g) => g.gameSlug), ["game-4", "game-3", "game-2"]);
});
