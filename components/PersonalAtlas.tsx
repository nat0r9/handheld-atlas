"use client";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { catalogUrl } from "../lib/catalog/query";
const eventName = "atlas-preferences";
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
  games: { name: string; slug: string }[];
  handhelds: { name: string; slug: string }[];
}) {
  const preferred = useSyncExternalStore(
    subscribe,
    () => read("atlas-handheld-v1", ""),
    () => "",
  );
  const [selection, setSelection] = useState<string | null>(null);
  const value =
    selection ?? (handhelds.some((h) => h.slug === preferred) ? preferred : "");
  return (
    <section className="atlas-panel p-5 sm:p-7">
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
              setSelection(e.target.value);
              write("atlas-handheld-v1", e.target.value);
            }}
            className="w-full rounded-lg px-3 py-3 text-sm"
          >
            <option value="">Any handheld</option>
            {handhelds.map((h) => (
              <option key={h.slug} value={h.slug}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="finder-game" className="mb-2 block text-sm font-bold">
            Game with benchmark data
          </label>
          <select
            id="finder-game"
            name="game"
            className="w-full rounded-lg px-3 py-3 text-sm"
          >
            <option value="">All measured games</option>
            {games.map((g) => (
              <option key={g.slug} value={g.slug}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="atlas-button-primary w-full">
          Find benchmarks →
        </button>
      </form>
      <p className="mt-4 text-sm leading-6 text-slate-400">
        Read the settings and evidence for each result. Coverage varies by
        device.
      </p>
      {value && (
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
