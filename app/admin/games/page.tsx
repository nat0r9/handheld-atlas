import Image from "next/image";
import Link from "next/link";
import GameCoverUpload from "../../../components/admin/GameCoverUpload";
import {
  CONTENT_EDITOR_ROLES,
} from "../../../lib/auth/roles";
import { requireRole } from "../../../lib/auth/require-role";
import { createGame, deleteGame } from "./actions";

interface AdminGamesPageProps {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
}

interface DatabaseGame {
  id: string;
  name: string;
  slug: string;
  genre: string;
  developer: string | null;
  release_year: number | null;
  atlas_score: number | null;
  best_handheld: string | null;
  recommended_tdp: string | null;
  notes: string | null;
  cover_image_url: string | null;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
}

function getStatusStyle(status: DatabaseGame["status"]) {
  switch (status) {
    case "published":
      return "border-green-400/30 bg-green-500/15 text-green-400";

    case "archived":
      return "border-red-400/30 bg-red-500/15 text-red-400";

    default:
      return "border-orange-400/30 bg-orange-500/15 text-orange-400";
  }
}

export default async function AdminGamesPage({
  searchParams,
}: AdminGamesPageProps) {
  const { error, success } = await searchParams;

  const {
    supabase,
  } = await requireRole(
    CONTENT_EDITOR_ROLES,
    "/",
  );

  const { data, error: gamesError } = await supabase
    .from("games")
    .select(
      "id, name, slug, genre, developer, release_year, atlas_score, best_handheld, recommended_tdp, notes, cover_image_url, status, created_at, updated_at",
    )
    .order("created_at", {
      ascending: false,
    });

  const games = (data ?? []) as DatabaseGame[];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <Link
              href="/admin"
              className="text-sm font-bold text-cyan-400 transition hover:text-cyan-300"
            >
              ← Back to dashboard
            </Link>

            <p className="mt-8 text-sm font-bold uppercase tracking-[0.3em] text-cyan-400">
              Content Management
            </p>

            <h1 className="mt-3 text-5xl font-black">Games</h1>

            <p className="mt-4 max-w-2xl text-slate-400">
              Add games to the database, upload cover images and keep the
              public game description separate from handheld performance data.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Database total
            </p>

            <p className="mt-2 text-3xl font-black">{games.length}</p>
          </div>
        </div>

        {success && (
          <div className="mt-8 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-300">
            {success}
          </div>
        )}

        {(error || gamesError) && (
          <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error ?? gamesError?.message}
          </div>
        )}

        <section className="mt-10 rounded-[2rem] border border-slate-800 bg-slate-900 p-6 md:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
            New Game
          </p>

          <h2 className="mt-3 text-3xl font-black">Add game</h2>

          <form action={createGame} className="mt-8">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <FormField
                label="Game name"
                name="name"
                placeholder="Cyberpunk 2077"
                required
              />

              <FormField
                label="Slug"
                name="slug"
                placeholder="cyberpunk-2077"
                helpText="Leave empty to generate it from the name."
              />

              <FormField
                label="Genre"
                name="genre"
                placeholder="RPG"
                required
              />

              <FormField
                label="Developer"
                name="developer"
                placeholder="CD Projekt Red"
              />

              <FormField
                label="Release year"
                name="releaseYear"
                type="number"
                placeholder="2020"
                min="1970"
                max="2100"
              />

              <FormField
                label="Atlas Score"
                name="atlasScore"
                type="number"
                placeholder="91"
                min="0"
                max="100"
              />

              <FormField
                label="Best handheld"
                name="bestHandheld"
                placeholder="ROG Ally X"
              />

              <FormField
                label="Recommended TDP"
                name="recommendedTdp"
                placeholder="25W"
              />

              <div>
                <label
                  htmlFor="status"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                >
                  Status
                </label>

                <select
                  id="status"
                  name="status"
                  defaultValue="draft"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <GameCoverUpload />
            </div>

            <section className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.06] p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                Copywriting guard
              </p>

              <h3 className="mt-2 text-lg font-black">
                Description and Performance Overview are separate.
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Use the field below only for the public game description:
                premise, genre context and what the player actually does.
                The public Performance Overview is generated from published
                presets and benchmarks, so do not paste handheld FPS notes here.
              </p>
            </section>

            <div className="mt-6">
              <label
                htmlFor="notes"
                className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
              >
                Game description
              </label>

              <textarea
                id="notes"
                name="notes"
                rows={6}
                placeholder="Describe the game itself: genre, premise, gameplay style and general context. Example: A party-based RPG where choices, exploration and tactical combat drive the adventure."
                className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
              />

              <p className="mt-2 text-xs leading-5 text-slate-600">
                Do not use this field for FPS, TDP, 1% lows or handheld
                caveats. Those belong in presets and benchmarks.
              </p>
            </div>

            <button
              type="submit"
              className="mt-6 rounded-xl bg-cyan-500 px-6 py-3 font-black text-slate-950 transition hover:bg-cyan-400"
            >
              Create game
            </button>
          </form>
        </section>

        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
                Existing Content
              </p>

              <h2 className="mt-2 text-3xl font-black">
                Game database
              </h2>
            </div>

            <p className="text-sm text-slate-500">
              {games.length} {games.length === 1 ? "game" : "games"}
            </p>
          </div>

          {games.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-8">
              <h3 className="text-xl font-black">
                No games in Supabase yet
              </h3>

              <p className="mt-2 text-slate-400">
                Add the first game using the form above.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {games.map((game) => (
                <article
                  key={game.id}
                  className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900"
                >
                  <div className="relative flex min-h-[24rem] items-center justify-center overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6">
                    <div className="pointer-events-none absolute h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />

                    {game.cover_image_url ? (
                      <div className="relative aspect-[3/4] h-80 max-h-[80vw] overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
                        <Image
                          src={game.cover_image_url}
                          alt={game.name}
                          fill
                          sizes="320px"
                          className="object-contain object-center"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-[3/4] h-80 items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950">
                        <p className="px-6 text-center text-sm font-bold uppercase tracking-[0.2em] text-slate-700">
                          No cover image
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-500">
                          {game.genre}
                        </p>

                        <h3 className="mt-2 text-2xl font-black">
                          {game.name}
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                          /games/{game.slug}
                        </p>
                      </div>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${getStatusStyle(
                          game.status,
                        )}`}
                      >
                        {game.status}
                      </span>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <GameStat
                        label="Developer"
                        value={game.developer ?? "Not set"}
                      />

                      <GameStat
                        label="Release"
                        value={
                          game.release_year?.toString() ?? "Not set"
                        }
                      />

                      <GameStat
                        label="Atlas Score"
                        value={
                          game.atlas_score !== null
                            ? `${game.atlas_score}/100`
                            : "Not set"
                        }
                      />

                      <GameStat
                        label="Recommended TDP"
                        value={game.recommended_tdp ?? "Not set"}
                      />
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-800 pt-5">
                      <Link
                        href={`/admin/games/${game.id}/edit`}
                        className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-400 transition hover:bg-cyan-500 hover:text-slate-950"
                      >
                        Edit
                      </Link>

                      {game.status === "published" && (
                        <Link
                          href={`/games/${game.slug}`}
                          target="_blank"
                          className="rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm font-bold text-green-400 transition hover:bg-green-500 hover:text-white"
                        >
                          View public
                        </Link>
                      )}

                      <form action={deleteGame}>
                        <input
                          type="hidden"
                          name="gameId"
                          value={game.id}
                        />

                        <button
                          type="submit"
                          className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500 hover:text-white"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

interface FormFieldProps {
  label: string;
  name: string;
  placeholder?: string;
  helpText?: string;
  type?: "text" | "number";
  required?: boolean;
  min?: string;
  max?: string;
}

function FormField({
  label,
  name,
  placeholder,
  helpText,
  type = "text",
  required = false,
  min,
  max,
}: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
      />

      {helpText && (
        <p className="mt-2 text-xs text-slate-600">
          {helpText}
        </p>
      )}
    </div>
  );
}

interface GameStatProps {
  label: string;
  value: string;
}

function GameStat({ label, value }: GameStatProps) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-bold text-slate-200">{value}</p>
    </div>
  );
}