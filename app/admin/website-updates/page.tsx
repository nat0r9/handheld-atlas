import Link from "next/link";
import { CONTENT_EDITOR_ROLES } from "../../../lib/auth/roles";
import { requireRole } from "../../../lib/auth/require-role";
import { publishWebsiteUpdate } from "./actions";

interface WebsiteUpdatesPageProps {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
}

type DeliveryStatus =
  | "pending"
  | "queued"
  | "sent"
  | "failed";

interface WebsiteUpdate {
  id: string;
  title: string;
  summary: string;
  url: string | null;
  delivery_status: DeliveryStatus;
  delivered_at: string | null;
  last_error: string | null;
  created_at: string;
}

function formatDate(
  value: string | null,
) {
  if (!value) {
    return "Not delivered yet";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusClass(
  status: DeliveryStatus,
) {
  switch (status) {
    case "sent":
      return "border-green-500/30 bg-green-500/10 text-green-300";
    case "failed":
      return "border-red-500/30 bg-red-500/10 text-red-300";
    case "queued":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-300";
    default:
      return "border-orange-500/30 bg-orange-500/10 text-orange-300";
  }
}

export default async function WebsiteUpdatesPage({
  searchParams,
}: WebsiteUpdatesPageProps) {
  const { supabase } = await requireRole(
    CONTENT_EDITOR_ROLES,
    "/",
  );
  const params = await searchParams;

  const { data, error } = await supabase
    .from("website_updates")
    .select(
      "id, title, summary, url, delivery_status, delivered_at, last_error, created_at",
    )
    .order("created_at", {
      ascending: false,
    })
    .limit(25);

  const updates =
    (data ?? []) as WebsiteUpdate[];

  return (
    <main className="atlas-page min-h-screen pb-16 text-white">
      <div className="atlas-shell pt-8 sm:pt-10">
        <Link
          href="/admin"
          className="text-sm font-black text-cyan-400 transition hover:text-white"
        >
          ← Back to Atlas Workspace
        </Link>

        <section className="mt-5 overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(3,7,18,0.98))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.3)] sm:p-8">
          <p className="text-[0.62rem] font-black uppercase tracking-[0.22em] text-red-400">
            Discord publishing
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-5xl">
            Website updates
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
            Announce meaningful website changes in #website-updates. News, guides, games and presets are routed automatically when they are first published.
          </p>
        </section>

        {params.success && (
          <div className="mt-5 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-sm font-bold text-green-300">
            {params.success}
          </div>
        )}

        {(params.error || error) && (
          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {params.error ??
              "Website update history could not be loaded."}
          </div>
        )}

        <section className="atlas-panel mt-6 p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <form
              action={publishWebsiteUpdate}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="title"
                  className="text-sm font-black text-white"
                >
                  Update title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  maxLength={256}
                  placeholder="Preset filters are now live"
                  className="mt-2 w-full rounded-xl px-4 py-3"
                />
              </div>

              <div>
                <label
                  htmlFor="summary"
                  className="text-sm font-black text-white"
                >
                  What changed
                </label>
                <textarea
                  id="summary"
                  name="summary"
                  required
                  maxLength={1500}
                  rows={6}
                  placeholder="Explain the useful change in one compact Discord-ready paragraph."
                  className="mt-2 w-full resize-y rounded-xl px-4 py-3"
                />
              </div>

              <div>
                <label
                  htmlFor="url"
                  className="text-sm font-black text-white"
                >
                  Related Atlas page (optional)
                </label>
                <input
                  id="url"
                  name="url"
                  type="text"
                  placeholder="/games or https://www.handheldatlas.com/..."
                  className="mt-2 w-full rounded-xl px-4 py-3"
                />
              </div>

              <button
                type="submit"
                className="atlas-button-primary"
              >
                Publish Discord update
              </button>
            </form>

            <aside className="rounded-2xl border border-white/[0.08] bg-black/20 p-5">
              <h2 className="text-lg font-black">
                Routing rules
              </h2>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="font-black text-cyan-300">
                    #website-news
                  </dt>
                  <dd className="mt-1 text-slate-500">
                    Published news and guides
                  </dd>
                </div>
                <div>
                  <dt className="font-black text-cyan-300">
                    #website-updates
                  </dt>
                  <dd className="mt-1 text-slate-500">
                    This manual form only
                  </dd>
                </div>
                <div>
                  <dt className="font-black text-cyan-300">
                    #new-games
                  </dt>
                  <dd className="mt-1 text-slate-500">
                    First game publication
                  </dd>
                </div>
                <div>
                  <dt className="font-black text-cyan-300">
                    #preset-news
                  </dt>
                  <dd className="mt-1 text-slate-500">
                    First preset publication
                  </dd>
                </div>
              </dl>
            </aside>
          </div>
        </section>

        <section className="mt-8">
          <div>
            <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-cyan-400">
              Delivery log
            </p>
            <h2 className="mt-2 text-2xl font-black">
              Recent website announcements
            </h2>
          </div>

          {updates.length === 0 ? (
            <div className="atlas-panel mt-4 border-dashed p-8 text-center text-sm text-slate-500">
              No website updates have been announced yet.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {updates.map((update) => (
                <article
                  key={update.id}
                  className="atlas-panel grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
                >
                  <div className="min-w-0">
                    <h3 className="text-lg font-black">
                      {update.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {update.summary}
                    </p>
                    <p className="mt-3 text-xs text-slate-600">
                      Created {formatDate(update.created_at)}
                      {update.delivered_at
                        ? ` • Delivered ${formatDate(update.delivered_at)}`
                        : ""}
                    </p>
                    {update.last_error && (
                      <p className="mt-2 text-xs text-red-300">
                        {update.last_error}
                      </p>
                    )}
                  </div>

                  <span
                    className={`w-fit rounded-full border px-3 py-1 text-[0.58rem] font-black uppercase tracking-[0.12em] ${statusClass(
                      update.delivery_status,
                    )}`}
                  >
                    {update.delivery_status}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
