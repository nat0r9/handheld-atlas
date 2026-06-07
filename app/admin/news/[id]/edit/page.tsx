import Link from "next/link";
import { redirect } from "next/navigation";
import NewsCoverUpload from "../../../../../components/admin/NewsCoverUpload";
import { createClient } from "../../../../../lib/supabase/server";
import { updateNews } from "../../actions";

interface EditNewsPageProps {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
}

interface DatabaseNewsItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  cover_image_url: string | null;
  author_name: string | null;
  reading_time: number | null;
  is_featured: boolean;
  related_game_slug: string | null;
  related_handheld_slug: string | null;
  status: "draft" | "published" | "archived";
}

interface SlugOption {
  slug: string;
  name: string;
}

export default async function EditNewsPage({
  params,
  searchParams,
}: EditNewsPageProps) {
  const { id } = await params;
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
    newsResult,
    gamesResult,
    handheldsResult,
  ] = await Promise.all([
    supabase
      .from("news")
      .select(`
        id,
        title,
        slug,
        category,
        excerpt,
        content,
        cover_image_url,
        author_name,
        reading_time,
        is_featured,
        related_game_slug,
        related_handheld_slug,
        status
      `)
      .eq("id", id)
      .single(),

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

  if (
    newsResult.error ||
    !newsResult.data
  ) {
    redirect(
      "/admin/news?error=News%20article%20not%20found",
    );
  }

  const databaseError =
    gamesResult.error?.message ??
    handheldsResult.error?.message ??
    null;

  if (databaseError) {
    redirect(
      `/admin/news?error=${encodeURIComponent(
        databaseError,
      )}`,
    );
  }

  const newsItem =
    newsResult.data as DatabaseNewsItem;

  const games =
    (gamesResult.data ?? []) as SlugOption[];

  const handhelds =
    (handheldsResult.data ?? []) as SlugOption[];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin/news"
          className="text-sm font-bold text-cyan-400 transition hover:text-cyan-300"
        >
          ← Back to news
        </Link>

        <div className="mt-8 flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-400">
              Editorial Management
            </p>

            <h1 className="mt-3 text-5xl font-black">
              Edit news article
            </h1>

            <p className="mt-4 max-w-3xl text-slate-400">
              Update the article content, cover image,
              featured state and publishing status.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Current article
            </p>

            <p className="mt-2 max-w-sm font-black">
              {newsItem.title}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              /news/{newsItem.slug}
            </p>
          </div>
        </div>

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
          <form action={updateNews}>
            <input
              type="hidden"
              name="newsId"
              value={newsItem.id}
            />

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <FormField
                label="Article title"
                name="title"
                defaultValue={newsItem.title}
                required
              />

              <FormField
                label="Slug"
                name="slug"
                defaultValue={newsItem.slug}
                helpText="Used in the public article URL."
              />

              <FormField
                label="Category"
                name="category"
                defaultValue={newsItem.category}
                required
              />

              <FormField
                label="Author"
                name="authorName"
                defaultValue={
                  newsItem.author_name ?? ""
                }
              />

              <FormField
                label="Reading time"
                name="readingTime"
                type="number"
                defaultValue={
                  newsItem.reading_time !== null
                    ? String(newsItem.reading_time)
                    : ""
                }
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
                  defaultValue={newsItem.status}
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
                defaultValue={
                  newsItem.related_game_slug ?? ""
                }
              />

              <SlugSelect
                label="Related handheld"
                name="relatedHandheldSlug"
                placeholder="No related handheld"
                options={handhelds}
                defaultValue={
                  newsItem.related_handheld_slug ?? ""
                }
              />

              <div className="flex items-end">
                <label className="flex w-full cursor-pointer items-center gap-4 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 transition hover:border-yellow-500/60">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    defaultChecked={
                      newsItem.is_featured
                    }
                    className="h-5 w-5 accent-yellow-400"
                  />

                  <span>
                    <span className="block font-bold text-slate-200">
                      Featured article
                    </span>

                    <span className="mt-1 block text-xs text-slate-500">
                      Show this story prominently on the
                      public news page.
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
                defaultValue={newsItem.excerpt}
                className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
              />
            </div>

            <div className="mt-6">
              <NewsCoverUpload
                defaultUrl={
                  newsItem.cover_image_url ?? ""
                }
              />
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
                rows={24}
                required
                defaultValue={newsItem.content}
                className="w-full resize-y rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 font-mono text-sm leading-7 text-white outline-none transition focus:border-cyan-500"
              />

              <p className="mt-3 text-sm text-slate-500">
                Paragraphs, headings and simple lists will
                be preserved on the public article page.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-xl bg-cyan-500 px-6 py-3 font-black text-slate-950 transition hover:bg-cyan-400"
              >
                Save news changes
              </button>

              <Link
                href="/admin/news"
                className="rounded-xl border border-slate-700 bg-slate-950 px-6 py-3 font-bold text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Cancel
              </Link>

              {newsItem.status === "published" && (
                <Link
                  href={`/news/${newsItem.slug}`}
                  target="_blank"
                  className="rounded-xl border border-green-500/40 bg-green-500/10 px-6 py-3 font-bold text-green-400 transition hover:bg-green-500 hover:text-white"
                >
                  Open public article ↗
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
}

function FormField({
  label,
  name,
  defaultValue = "",
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
        defaultValue={defaultValue}
        required={required}
        min={min}
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

interface SlugSelectProps {
  label: string;
  name: string;
  placeholder: string;
  options: SlugOption[];
  defaultValue: string;
}

function SlugSelect({
  label,
  name,
  placeholder,
  options,
  defaultValue,
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
        defaultValue={defaultValue}
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