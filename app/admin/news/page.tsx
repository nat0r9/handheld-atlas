import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import NewsCoverUpload from "../../../components/admin/NewsCoverUpload";
import { createClient } from "../../../lib/supabase/server";
import {
  createNews,
  deleteNews,
} from "./actions";

interface AdminNewsPageProps {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
}

interface SlugOption {
  slug: string;
  name: string;
}

interface DatabaseNewsItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  cover_image_url: string | null;
  author_name: string | null;
  reading_time: number | null;
  is_featured: boolean;
  related_game_slug: string | null;
  related_handheld_slug: string | null;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

function getStatusStyle(
  status: DatabaseNewsItem["status"],
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

export default async function AdminNewsPage({
  searchParams,
}: AdminNewsPageProps) {
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
    gamesResult,
    handheldsResult,
    newsResult,
  ] = await Promise.all([
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

    supabase
      .from("news")
      .select(`
        id,
        title,
        slug,
        category,
        excerpt,
        cover_image_url,
        author_name,
        reading_time,
        is_featured,
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
  ]);

  const games =
    (gamesResult.data ?? []) as SlugOption[];

  const handhelds =
    (handheldsResult.data ?? []) as SlugOption[];

  const newsItems =
    (newsResult.data ?? []) as DatabaseNewsItem[];

  const databaseError =
    gamesResult.error?.message ??
    handheldsResult.error?.message ??
    newsResult.error?.message ??
    null;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin"
          className="text-sm font-bold text-cyan-400 transition hover:text-cyan-300"
        >
          ← Back to dashboard
        </Link>

        <div className="mt-8 flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-400">
              Editorial Management
            </p>

            <h1 className="mt-3 text-5xl font-black">
              News
            </h1>

            <p className="mt-4 max-w-3xl text-slate-400">
              Publish handheld gaming news, hardware
              announcements, updates and featured stories.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Database total
            </p>

            <p className="mt-2 text-3xl font-black">
              {newsItems.length}
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
            New Article
          </p>

          <h2 className="mt-3 text-3xl font-black">
            Write news article
          </h2>

          <form action={createNews} className="mt-8">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <FormField
                label="Article title"
                name="title"
                placeholder="ROG Ally X receives a major update"
                required
              />

              <FormField
                label="Slug"
                name="slug"
                placeholder="rog-ally-x-major-update"
                helpText="Leave empty to generate it from the title."
              />

              <FormField
                label="Category"
                name="category"
                placeholder="Hardware"
                required
              />

              <FormField
                label="Author"
                name="authorName"
                placeholder="HandheldAtlas Team"
              />

              <FormField
                label="Reading time"
                name="readingTime"
                type="number"
                placeholder="5"
                min="1"
                helpText="Estimated reading time in minutes."
              />

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

              <div className="flex items-end">
                <label className="flex w-full cursor-pointer items-center gap-4 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 transition hover:border-yellow-500/60">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    className="h-5 w-5 accent-yellow-400"
                  />

                  <span>
                    <span className="block font-bold text-slate-200">
                      Featured article
                    </span>

                    <span className="mt-1 block text-xs text-slate-500">
                      Show prominently on the news page.
                    </span>
                  </span>
                </label>
              </div>
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
                placeholder="A short article summary used on cards, previews and search results."
                className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
              />
            </div>

            <div className="mt-6">
              <NewsCoverUpload />
            </div>

            <div className="mt-6">
              <label
                htmlFor="content"
                className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
              >
                Article content
              </label>

              <textarea
                id="content"
                name="content"
                rows={20}
                required
                placeholder={`Write the full article here.

Main heading

Write the opening paragraphs here.

What changed

- First important change
- Second important change
- Third important change

What it means for players

Explain the impact here.

Final thoughts

Finish the article here.`}
                className="w-full resize-y rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 font-mono text-sm leading-7 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
              />

              <p className="mt-3 text-sm text-slate-500">
                Paragraphs, headings and simple lists will
                be preserved on the public article page.
              </p>
            </div>

            <button
              type="submit"
              className="mt-8 rounded-xl bg-cyan-500 px-7 py-4 font-black text-slate-950 transition hover:bg-cyan-400"
            >
              Create news article
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
                News database
              </h2>
            </div>

            <p className="text-sm text-slate-500">
              {newsItems.length}{" "}
              {newsItems.length === 1
                ? "article"
                : "articles"}
            </p>
          </div>

          {newsItems.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-8">
              <h3 className="text-xl font-black">
                No news articles yet
              </h3>

              <p className="mt-2 text-slate-400">
                Create the first article using the form
                above.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {newsItems.map((newsItem) => (
                <article
                  key={newsItem.id}
                  className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900"
                >
                  {newsItem.cover_image_url ? (
                    <div className="relative aspect-[16/9] overflow-hidden border-b border-slate-800 bg-slate-950">
                      <Image
                        src={newsItem.cover_image_url}
                        alt={newsItem.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover object-center"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                      {newsItem.is_featured && (
                        <span className="absolute left-5 top-5 rounded-full border border-yellow-500/40 bg-yellow-500/20 px-3 py-1 text-xs font-black uppercase tracking-wide text-yellow-300 backdrop-blur">
                          Featured
                        </span>
                      )}

                      <div className="absolute inset-x-0 bottom-0 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                          {newsItem.category}
                        </p>

                        <h3 className="mt-2 text-2xl font-black">
                          {newsItem.title}
                        </h3>
                      </div>
                    </div>
                  ) : (
                    <div className="relative flex aspect-[16/9] items-center justify-center border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-black p-8">
                      {newsItem.is_featured && (
                        <span className="absolute left-5 top-5 rounded-full border border-yellow-500/40 bg-yellow-500/20 px-3 py-1 text-xs font-black uppercase tracking-wide text-yellow-300">
                          Featured
                        </span>
                      )}

                      <div className="text-center">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
                          {newsItem.category}
                        </p>

                        <h3 className="mt-3 text-3xl font-black">
                          {newsItem.title}
                        </h3>
                      </div>
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${getStatusStyle(
                          newsItem.status,
                        )}`}
                      >
                        {newsItem.status}
                      </span>

                      {newsItem.is_featured && (
                        <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-yellow-400">
                          Featured
                        </span>
                      )}
                    </div>

                    <p className="mt-5 leading-7 text-slate-400">
                      {newsItem.excerpt}
                    </p>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <NewsStat
                        label="Author"
                        value={
                          newsItem.author_name ??
                          "HandheldAtlas"
                        }
                      />

                      <NewsStat
                        label="Reading time"
                        value={
                          newsItem.reading_time !== null
                            ? `${newsItem.reading_time} min`
                            : "Not set"
                        }
                      />

                      <NewsStat
                        label="Published"
                        value={formatDate(
                          newsItem.published_at,
                        )}
                      />

                      <NewsStat
                        label="Category"
                        value={newsItem.category}
                      />

                      <NewsStat
                        label="Related game"
                        value={
                          newsItem.related_game_slug ??
                          "None"
                        }
                      />

                      <NewsStat
                        label="Related handheld"
                        value={
                          newsItem.related_handheld_slug ??
                          "None"
                        }
                      />
                    </div>

                    <p className="mt-5 break-all text-sm text-slate-600">
                      /news/{newsItem.slug}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-800 pt-5">
                      <Link
                        href={`/admin/news/${newsItem.id}/edit`}
                        className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-400 transition hover:bg-cyan-500 hover:text-slate-950"
                      >
                        Edit
                      </Link>

                      {newsItem.status === "published" && (
                        <Link
                          href={`/news/${newsItem.slug}`}
                          target="_blank"
                          className="rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm font-bold text-green-400 transition hover:bg-green-500 hover:text-white"
                        >
                          View public
                        </Link>
                      )}

                      <form action={deleteNews}>
                        <input
                          type="hidden"
                          name="newsId"
                          value={newsItem.id}
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

interface NewsStatProps {
  label: string;
  value: string;
}

function NewsStat({
  label,
  value,
}: NewsStatProps) {
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