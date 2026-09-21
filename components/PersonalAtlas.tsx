"use client";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { catalogUrl } from "../lib/catalog/query";
import type { RecentBenchmarkGame } from "../lib/catalog/recent";
const eventName = "atlas-preferences";
const gameCountLabel = (count: number) => `${count} ${count === 1 ? "game" : "games"}`;
function subscribe(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener(eventName, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(eventName, notify);
  };
}
function read(key: string, fallback: string) {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
    window.dispatchEvent(new Event(eventName));
    return true;
  } catch {
    return false;
  }
}
type SavedGame = { name: string; slug: string };
function parseGames(value: string): SavedGame[] {
  try {
    const data: unknown = JSON.parse(value);
    return Array.isArray(data)
      ? data
          .filter((g): g is SavedGame =>
            Boolean(
              g &&
                typeof g.name === "string" &&
                typeof g.slug === "string" &&
                /^[a-z0-9-]+$/.test(g.slug),
            ),
          )
          .slice(0, 100)
      : [];
  } catch {
    return [];
  }
}
export function SaveGameButton({ name, slug }: SavedGame) {
  const saved = useSyncExternalStore(
    subscribe,
    () => read("atlas-games-v1", "[]"),
    () => "[]",
  );
  const games = parseGames(saved);
  const isSaved = games.some((g) => g.slug === slug);
  const [error, setError] = useState(false);
  return (
    <div>
      <button
        className="atlas-button-secondary"
        aria-pressed={isSaved}
        onClick={() => {
          setError(
            !write(
              "atlas-games-v1",
              JSON.stringify(
                isSaved
                  ? games.filter((g) => g.slug !== slug)
                  : [{ name, slug }, ...games].slice(0, 100),
              ),
            ),
          );
        }}
      >
        {isSaved ? "★ Saved game" : "☆ Save game"}
      </button>
      {error && (
        <p role="status" className="mt-2 text-sm">
          Your browser could not save this preference.
        </p>
      )}
    </div>
  );
}
export function SavedGames() {
  const saved = useSyncExternalStore(
    subscribe,
    () => read("atlas-games-v1", "[]"),
    () => "[]",
  );
  const games = parseGames(saved);
  if (!games.length) return null;
  return (
    <section className="atlas-panel mb-5 p-5">
      <h2 className="text-xl">Your saved games</h2>
      <p className="mt-2 text-sm text-slate-400">
        Saved on this device. Open a game to check its latest results.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {games.map((g) => (
          <Link
            key={g.slug}
            className="atlas-button-secondary"
            href={`/games/${g.slug}`}
          >
            {g.name} →
          </Link>
        ))}
      </div>
    </section>
  );
}
export function QuickFinder({
  games,
  handhelds,
}: {
  games: { name: string; slug: string; handheldSlugs: string[] }[];
  handhelds: { name: string; slug: string }[];
}) {
  const preferred = useSyncExternalStore(
    subscribe,
    () => read("atlas-handheld-v1", ""),
    () => "",
  );
  const [selection, setSelection] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [game, setGame] = useState("");
  const value =
    selection ?? (handhelds.some((h) => h.slug === preferred) ? preferred : "");
  const availableGames = value
    ? games.filter((g) => g.handheldSlugs.includes(value)) : games;
  const selectedGame = availableGames.some((g) => g.slug === game) ? game : "";
  return (
    <section id="my-handheld" className="atlas-panel scroll-mt-24 p-5 sm:p-7">
      <p className="atlas-section-label">Start with your handheld</p>
      <h2 className="mt-3 text-2xl sm:text-3xl">Find your next settings.</h2>
      <form action="/benchmarks" method="get" className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="finder-device"
            className="mb-2 block text-sm font-bold"
          >
            My handheld
          </label>
          <select
            id="finder-device"
            name="handheld"
            value={value}
            onChange={(e) => {
              const saved = write("atlas-handheld-v1", e.target.value);
              setSelection(saved ? null : e.target.value);
              setSaveError(!saved);
              setGame("");
            }}
            className="w-full rounded-lg px-3 py-3 text-sm"
          >
            <option value="">Any handheld</option>
            {[...handhelds].sort((a, b) => a.name.localeCompare(b.name)).map((h) => (
              <option key={h.slug} value={h.slug}>
                {h.name} ({gameCountLabel(games.filter((g) => g.handheldSlugs.includes(h.slug)).length)})
              </option>
            ))}
          </select>
          <p role="status" className="mt-2 text-xs leading-5 text-slate-400">
            {saveError
              ? "Your browser could not remember this choice. The finder still works for this visit."
              : "Your choice is remembered in this browser. Choose Any handheld to clear it."}
          </p>
        </div>
        <div>
          <label htmlFor="finder-game" className="mb-2 block text-sm font-bold">
            Game with benchmark data
          </label>
          <select
            id="finder-game"
            name="game"
            value={selectedGame}
            onChange={(e) => setGame(e.target.value)}
            disabled={!availableGames.length}
            className="w-full rounded-lg px-3 py-3 text-sm"
          >
            <option value="">{availableGames.length ? "All measured games" : "No benchmarks yet"}</option>
            {availableGames.map((g) => (
              <option key={g.slug} value={g.slug}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <p role="status" className="text-sm text-slate-300">
          {availableGames.length
            ? `${gameCountLabel(availableGames.length)} with benchmark data${value ? " for this handheld" : ""}.`
            : "No benchmark data for this handheld yet. You can still explore its hardware profile."}
        </p>
        <button type="submit" disabled={!availableGames.length} className="atlas-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
          Find benchmarks →
        </button>
      </form>
      {value && !availableGames.length && (
        <Link className="atlas-button-secondary mt-3 w-full" href={`/handhelds/${value}`}>
          Explore this handheld →
        </Link>
      )}
      <p className="mt-4 text-sm leading-6 text-slate-400">
        Read the settings and evidence for each result. Coverage varies by
        device.
      </p>
      {value && availableGames.length > 0 && (
        <Link
          className="mt-3 inline-block py-2 text-sm font-bold text-cyan-300"
          href={catalogUrl("/games", { handheld: value, coverage: "any" })}
        >
          All games with data for my handheld →
        </Link>
      )}
    </section>
  );
}

export function LatestForHandheld({ handhelds, recent }: {
  handhelds: { name: string; slug: string }[];
  recent: RecentBenchmarkGame[];
}) {
  const preferred = useSyncExternalStore(subscribe,
    () => read("atlas-handheld-v1", ""), () => "");
  const handheld = handhelds.find((h) => h.slug === preferred);
  if (!handheld) return null;
  const additions = recent.filter((g) => g.handheldSlug === handheld.slug);
  return (
    <section aria-labelledby="latest-for-device" className="atlas-panel mb-6 p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="atlas-section-label">Your handheld</p>
          <h2 id="latest-for-device" className="mt-2 break-words text-2xl font-bold">Latest for {handheld.name}</h2>
        </div>
        <a href="#my-handheld" className="py-2 text-sm font-bold text-cyan-300">Change handheld ↑</a>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        Latest benchmark additions, grouped by game. Dates show when results were added to Atlas, not when they were tested.
      </p>
      {additions.length ? (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {additions.map((game) => (
            <Link key={game.gameSlug} prefetch={false}
              href={catalogUrl("/benchmarks", { handheld: handheld.slug, game: game.gameSlug })}
              className="atlas-card min-w-0 p-4 transition hover:border-cyan-400/40">
              <p className="text-xs text-slate-400">Latest addition · <time dateTime={game.addedAt}>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(game.addedAt))}</time></p>
              <h3 className="mt-2 break-words text-lg font-bold text-white">{game.gameName}</h3>
              <p className="mt-2 text-sm text-slate-300">{game.resultCount} {game.resultCount === 1 ? "result" : "results"} for this handheld</p>
              <p className="mt-4 text-sm font-bold text-cyan-300">See settings & evidence →</p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm text-slate-300">No dated benchmark additions for this handheld yet. Explore its profile for available information.</p>
      )}
      <div className="mt-5 flex flex-wrap gap-3">
        <Link prefetch={false} className="atlas-button-secondary" href={catalogUrl("/benchmarks", { handheld: handheld.slug })}>All benchmarks →</Link>
        <Link prefetch={false} className="atlas-button-secondary" href={`/handhelds/${handheld.slug}`}>Handheld profile →</Link>
      </div>
    </section>
  );
}
