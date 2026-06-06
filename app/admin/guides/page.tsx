import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import GuideCoverUpload from "../../../components/admin/GuideCoverUpload";
import { createClient } from "../../../lib/supabase/server";
import {
  createGuide,
  deleteGuide,
} from "./actions";

interface AdminGuidesPageProps {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
}

interface DatabaseGuide {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  reading_time: number | null;
  difficulty: string | null;
  cover_image_url: string | null;
  related_game_slug: string | null;
  related_handheld_slug: string | null;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface SlugOption {
  slug: string;
  name: string;
}

function getStatusStyle(
  status: DatabaseGuide["status"],
) {
  switch (status) {
    case "published":
      return "border-green-400/30 bg-green-500/15 text-green-400";

    case "archived":
      return "border-red-400/30 bg-red-500/15 text-red-400";

    default:
      return "border-orange-400/30 bg-orange-500/15 text-orange-400";
  }
}

function getDifficultyStyle(difficulty: string | null) {
  switch (difficulty?.toLowerCase()) {
    case "beginner":
      return "border-green-400/30 bg-green-500/15 text-green-400";

    case "intermediate":
      return "border-orange-400/30 bg-orange-500/15 text-orange-400";

    case "advanced":
      return "border-red-400/30 bg-red-500/15 text-red-400";

    default:
      return "border-slate-500/30 bg-slate-500/15 text-slate-300";
  }
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not published";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default async function AdminGuidesPage({
  searchParams,
}: AdminGuidesPageProps) {
  const { error, success } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    redirect("/admin/login");
  }

  const [
    guidesResult,
    gamesResult,
    handheldsResult,
  ] = await Promise.all([
    supabase
      .from("guides")
      .select(`
        id,
        title,
        slug,
        category,
        excerpt,
        content,
        reading_time,
        difficulty,
        cover_image_url,
        related_game_slug,
        related_handheld_slug,
        status,
        published_at,
        created_at,
        updated_at
      `)
      .order("created_at", {
        ascending: false,
      }),

    supabase
      .from("games")
      .select("slug, name")
      .order("name", {
        ascending: true,
      }),

    supabase
      .from("handhelds")
      .select("slug, name")
      .order("name", {
        ascending: true,
      }),
  ]);

  const guides =
    (guidesResult.data ?? []) as DatabaseGuide[];

  const games =
    (gamesResult.data ?? []) as SlugOption[];

  const handhelds =
    (handheldsResult.data ?? []) as SlugOption[];

  const databaseError =
    guidesResult.error?.message ??
    gamesResult.error?.message ??
    handheldsResult.error?.message ??
    null;

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

            <h1 className="mt-3 text-5xl font-black">
              Guides
            </h1>

            <p className="mt-4 max-w-3xl text-slate-400">
              Write optimization guides, setup tutorials and
              handheld troubleshooting articles for the
              HandheldAtlas knowledge base.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Database total
            </p>

            <p className="mt-2 text-3xl font-black">
              {guides.length}
            </p>
          </div>
        </div>

        {success && (
          <div className="mt-8 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-300">
            {success}
          </div>
        )}

        {(error || databaseError) && (
          <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error ?? databaseError}
          </div>
        )}

        <section className="mt-10 rounded-[2rem] border border-slate-800 bg-slate-900 p-6 md:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
            New Guide
          </p>

          <h2 className="mt-3 text-3xl font-black">
            Write guide
          </h2>

          <form action={createGuide} className="mt-8">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <FormField
                label="Guide title"
                name="title"
                placeholder="Best ROG Ally X Setup for Docked Gaming"
                required
              />

              <FormField
                label="Slug"
                name="slug"
                placeholder="best-rog-ally-x-docked-setup"
                helpText="Leave empty to generate it from the title."
              />

              <FormField
                label="Category"
                name="category"
                placeholder="Performance"
                required
              />

              <FormField
                label="Reading time"
                name="readingTime"
                type="number"
                placeholder="8"
                min="1"
                helpText="Estimated reading time in minutes."
              />

              <div>
                <label
                  htmlFor="difficulty"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                >
                  Difficulty
                </label>

                <select
                  id="difficulty"
                  name="difficulty"
                  defaultValue="Beginner"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                >
                  <option value="Beginner">
                    Beginner
                  </option>

                  <option value="Intermediate">
                    Intermediate
                  </option>

                  <option value="Advanced">
                    Advanced
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                >
                  Content status
                </label>

                <select
                  id="status"
                  name="status"
                  defaultValue="draft"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                >
                  <option value="draft">
                    Draft
                  </option>

                  <option value="published">
                    Published
                  </option>

                  <option value="archived">
                    Archived
                  </option>
                </select>
              </div>

              <SlugSelect
                label="Related game"
                name="relatedGameSlug"
                placeholder="No related game"
                options={games}
              />

              <SlugSelect
                label="Related handheld"
                name="relatedHandheldSlug"
                placeholder="No related handheld"
                options={handhelds}
              />
            </div>

            <div className="mt-6">
              <label
                htmlFor="excerpt"
                className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
              >
                Excerpt
              </label>

              <textarea
                id="excerpt"
                name="excerpt"
                rows={4}
                required
                placeholder="A short summary shown on guide cards and search results."
                className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
              />
            </div>

            <div className="mt-6">
              <GuideCoverUpload />
            </div>

            <div className="mt-6">
              <label
                htmlFor="content"
                className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
              >
                Guide content
              </label>

              <textarea
                id="content"
                name="content"
                rows={22}
                required
                placeholder={`Write the full guide here.

You can structure it with headings and paragraphs, for example:

Introduction

This guide explains...

Step 1 — Update your drivers

Open AMD Software...

Step 2 — Configure Armoury Crate

Set the operating mode to...

Final recommendations

Save the profile and restart the game.`}
                className="w-full resize-y rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 font-mono text-sm leading-7 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
              />

              <p className="mt-3 text-sm text-slate-500">
                For now, paragraphs and line breaks are preserved.
                A richer block editor can be added later.
              </p>
            </div>

            <button
              type="submit"
              className="mt-8 rounded-xl bg-cyan-500 px-7 py-4 font-black text-slate-950 transition hover:bg-cyan-400"
            >
              Create guide
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
                Guide database
              </h2>
            </div>

            <p className="text-sm text-slate-500">
              {guides.length}{" "}
              {guides.length === 1
                ? "guide"
                : "guides"}
            </p>
          </div>

          {guides.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-8">
              <h3 className="text-xl font-black">
                No guides in Supabase yet
              </h3>

              <p className="mt-2 text-slate-400">
                Write the first guide using the editor above.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {guides.map((guide) => (
                <article
                  key={guide.id}
                  className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900"
                >
                  {guide.cover_image_url ? (
                    <div className="relative aspect-[16/9] overflow-hidden border-b border-slate-800 bg-slate-950">
                      <Image
                        src={guide.cover_image_url}
                        alt={guide.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover object-center"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                      <div className="absolute inset-x-0 bottom-0 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                          {guide.category}
                        </p>

                        <h3 className="mt-2 text-2xl font-black">
                          {guide.title}
                        </h3>
                      </div>
                    </div>
                  ) : (
                    <div className="flex aspect-[16/9] items-center justify-center border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-black p-8">
                      <div className="text-center">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
                          {guide.category}
                        </p>

                        <h3 className="mt-3 text-3xl font-black">
                          {guide.title}
                        </h3>
                      </div>
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${getStatusStyle(
                          guide.status,
                        )}`}
                      >
                        {guide.status}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${getDifficultyStyle(
                          guide.difficulty,
                        )}`}
                      >
                        {guide.difficulty ?? "Not set"}
                      </span>
                    </div>

                    <p className="mt-5 leading-7 text-slate-400">
                      {guide.excerpt}
                    </p>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <GuideStat
                        label="Reading time"
                        value={
                          guide.reading_time !== null
                            ? `${guide.reading_time} min`
                            : "Not set"
                        }
                      />

                      <GuideStat
                        label="Published"
                        value={formatDate(
                          guide.published_at,
                        )}
                      />

                      <GuideStat
                        label="Related game"
                        value={
                          guide.related_game_slug ??
                          "None"
                        }
                      />

                      <GuideStat
                        label="Related handheld"
                        value={
                          guide.related_handheld_slug ??
                          "None"
                        }
                      />
                    </div>

                    <p className="mt-5 break-all text-sm text-slate-600">
                      /guides/{guide.slug}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-800 pt-5">
                      <Link
                        href={`/admin/guides/${guide.id}/edit`}
                        className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-400 transition hover:bg-cyan-500 hover:text-slate-950"
                      >
                        Edit
                      </Link>

                      {guide.status === "published" && (
                        <Link
                          href={`/guides/${guide.slug}`}
                          target="_blank"
                          className="rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm font-bold text-green-400 transition hover:bg-green-500 hover:text-white"
                        >
                          View public
                        </Link>
                      )}

                      <form action={deleteGuide}>
                        <input
                          type="hidden"
                          name="guideId"
                          value={guide.id}
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
}

function FormField({
  label,
  name,
  placeholder,
  helpText,
  type = "text",
  required = false,
  min,
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

interface SlugSelectProps {
  label: string;
  name: string;
  placeholder: string;
  options: SlugOption[];
}

function SlugSelect({
  label,
  name,
  placeholder,
  options,
}: SlugSelectProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
      >
        {label}
      </label>

      <select
        id={name}
        name={name}
        defaultValue=""
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
      >
        <option value="">
          {placeholder}
        </option>

        {options.map((option) => (
          <option
            key={option.slug}
            value={option.slug}
          >
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}

interface GuideStatProps {
  label: string;
  value: string;
}

function GuideStat({
  label,
  value,
}: GuideStatProps) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words font-bold text-slate-200">
        {value}
      </p>
    </div>
  );
}