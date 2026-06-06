import Link from "next/link";
import { redirect } from "next/navigation";
import GuideCoverUpload from "../../../../../components/admin/GuideCoverUpload";
import { createClient } from "../../../../../lib/supabase/server";
import { updateGuide } from "../../actions";

interface EditGuidePageProps {
  params: Promise<{
    id: string;
  }>;

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
}

interface SlugOption {
  slug: string;
  name: string;
}

export default async function EditGuidePage({
  params,
  searchParams,
}: EditGuidePageProps) {
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
    guideResult,
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
    guideResult.error ||
    !guideResult.data
  ) {
    redirect(
      "/admin/guides?error=Guide%20not%20found",
    );
  }

  const databaseError =
    gamesResult.error?.message ??
    handheldsResult.error?.message ??
    null;

  if (databaseError) {
    redirect(
      `/admin/guides?error=${encodeURIComponent(
        databaseError,
      )}`,
    );
  }

  const guide =
    guideResult.data as DatabaseGuide;

  const games =
    (gamesResult.data ?? []) as SlugOption[];

  const handhelds =
    (handheldsResult.data ??
      []) as SlugOption[];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin/guides"
          className="text-sm font-bold text-cyan-400 transition hover:text-cyan-300"
        >
          ← Back to guides
        </Link>

        <div className="mt-8 flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-400">
              Content Management
            </p>

            <h1 className="mt-3 text-5xl font-black">
              Edit guide
            </h1>

            <p className="mt-4 max-w-3xl text-slate-400">
              Update the guide content, cover image,
              related content and publishing state.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Current guide
            </p>

            <p className="mt-2 max-w-sm font-black">
              {guide.title}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              /guides/{guide.slug}
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
          <form action={updateGuide}>
            <input
              type="hidden"
              name="guideId"
              value={guide.id}
            />

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <FormField
                label="Guide title"
                name="title"
                defaultValue={guide.title}
                required
              />

              <FormField
                label="Slug"
                name="slug"
                defaultValue={guide.slug}
                helpText="Used in the public guide URL."
              />

              <FormField
                label="Category"
                name="category"
                defaultValue={guide.category}
                required
              />

              <FormField
                label="Reading time"
                name="readingTime"
                type="number"
                defaultValue={
                  guide.reading_time !== null
                    ? String(guide.reading_time)
                    : ""
                }
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
                  defaultValue={
                    guide.difficulty ?? "Beginner"
                  }
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
                  defaultValue={guide.status}
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
                  guide.related_game_slug ?? ""
                }
              />

              <SlugSelect
                label="Related handheld"
                name="relatedHandheldSlug"
                placeholder="No related handheld"
                options={handhelds}
                defaultValue={
                  guide.related_handheld_slug ?? ""
                }
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
                defaultValue={guide.excerpt}
                className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
              />
            </div>

            <div className="mt-6">
              <GuideCoverUpload
                defaultUrl={
                  guide.cover_image_url ?? ""
                }
              />
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
                rows={24}
                required
                defaultValue={guide.content}
                className="w-full resize-y rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 font-mono text-sm leading-7 text-white outline-none transition focus:border-cyan-500"
              />

              <p className="mt-3 text-sm text-slate-500">
                Paragraphs and line breaks will be
                preserved on the public guide page.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-xl bg-cyan-500 px-6 py-3 font-black text-slate-950 transition hover:bg-cyan-400"
              >
                Save guide changes
              </button>

              <Link
                href="/admin/guides"
                className="rounded-xl border border-slate-700 bg-slate-950 px-6 py-3 font-bold text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Cancel
              </Link>

              {guide.status === "published" && (
                <Link
                  href={`/guides/${guide.slug}`}
                  target="_blank"
                  className="rounded-xl border border-green-500/40 bg-green-500/10 px-6 py-3 font-bold text-green-400 transition hover:bg-green-500 hover:text-white"
                >
                  Open public guide ↗
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