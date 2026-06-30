import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CONTENT_EDITOR_ROLES,
} from "../../../../../lib/auth/roles";
import { requireRole } from "../../../../../lib/auth/require-role";
import { updateGame } from "../../actions";
import GameCoverUpload from "@/components/admin/GameCoverUpload";

interface EditGamePageProps {
  params: Promise<{
    id: string;
  }>;

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
}

export default async function EditGamePage({
  params,
  searchParams,
}: EditGamePageProps) {
  const { id } = await params;
  const { error, success } = await searchParams;

  const {
    supabase,
  } = await requireRole(
    CONTENT_EDITOR_ROLES,
    "/",
  );

  const { data, error: gameError } = await supabase
    .from("games")
    .select(
      "id, name, slug, genre, developer, release_year, atlas_score, best_handheld, recommended_tdp, notes, cover_image_url, status",
    )
    .eq("id", id)
    .single();

  if (gameError || !data) {
    redirect("/admin/games?error=Game%20not%20found");
  }

  const game = data as DatabaseGame;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/admin/games"
          className="text-sm font-bold text-cyan-400 transition hover:text-cyan-300"
        >
          ← Back to games
        </Link>

        <p className="mt-8 text-sm font-bold uppercase tracking-[0.3em] text-cyan-400">
          Content Management
        </p>

        <h1 className="mt-3 text-5xl font-black">
          Edit game
        </h1>

        <p className="mt-4 text-slate-400">
          Update the game profile, publishing state and public metadata.
          Keep the game description separate from generated handheld
          performance context.
        </p>

        {success && (
          <div className="mt-8 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-300">
            {success}
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        <section className="mt-10 rounded-[2rem] border border-slate-800 bg-slate-900 p-6 md:p-8">
          <form action={updateGame}>
            <input
              type="hidden"
              name="gameId"
              value={game.id}
            />

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <FormField
                label="Game name"
                name="name"
                defaultValue={game.name}
                required
              />

              <FormField
                label="Slug"
                name="slug"
                defaultValue={game.slug}
                helpText="Used in the public URL."
              />

              <FormField
                label="Genre"
                name="genre"
                defaultValue={game.genre}
                required
              />

              <FormField
                label="Developer"
                name="developer"
                defaultValue={game.developer ?? ""}
              />

              <FormField
                label="Release year"
                name="releaseYear"
                type="number"
                defaultValue={
                  game.release_year?.toString() ?? ""
                }
                min="1970"
                max="2100"
              />

              <FormField
                label="Atlas Score"
                name="atlasScore"
                type="number"
                defaultValue={
                  game.atlas_score?.toString() ?? ""
                }
                min="0"
                max="100"
              />

              <FormField
                label="Best handheld"
                name="bestHandheld"
                defaultValue={game.best_handheld ?? ""}
              />

              <FormField
                label="Recommended TDP"
                name="recommendedTdp"
                defaultValue={game.recommended_tdp ?? ""}
              />

              <GameCoverUpload
                defaultUrl={game.cover_image_url ?? ""}
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
                  defaultValue={game.status}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <section className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.06] p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                Copywriting guard
              </p>

              <h3 className="mt-2 text-lg font-black">
                This field is not the Performance Overview.
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Keep this as the public game description: premise, genre
                context and gameplay. The Performance Overview on the public
                game page is generated from published presets and benchmarks,
                so it will not copy this text anymore.
              </p>
            </section>

            <div className="mt-5">
              <label
                htmlFor="notes"
                className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
              >
                Game description
              </label>

              <textarea
                id="notes"
                name="notes"
                rows={7}
                defaultValue={game.notes ?? ""}
                placeholder="Describe the game itself: genre, premise, gameplay style and general context."
                className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
              />

              <p className="mt-2 text-xs leading-5 text-slate-600">
                Do not use this field for FPS, TDP, 1% lows or handheld
                caveats. Those belong in presets and benchmarks.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-xl bg-cyan-500 px-6 py-3 font-black text-slate-950 transition hover:bg-cyan-400"
              >
                Save changes
              </button>

              <Link
                href="/admin/games"
                className="rounded-xl border border-slate-700 bg-slate-950 px-6 py-3 font-bold text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Cancel
              </Link>

              {game.status === "published" && (
                <Link
                  href={`/games/${game.slug}`}
                  target="_blank"
                  className="rounded-xl border border-green-500/40 bg-green-500/10 px-6 py-3 font-bold text-green-400 transition hover:bg-green-500 hover:text-white"
                >
                  Open public page ↗
                </Link>
              )}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

interface FormFieldProps {
  label: string;
  name: string;
  defaultValue?: string;
  helpText?: string;
  type?: "text" | "number";
  required?: boolean;
  min?: string;
  max?: string;
}

function FormField({
  label,
  name,
  defaultValue = "",
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
        defaultValue={defaultValue}
        required={required}
        min={min}
        max={max}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
      />

      {helpText && (
        <p className="mt-2 text-xs text-slate-600">
          {helpText}
        </p>
      )}
    </div>
  );
}