import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

interface MyGuideSubmissionsPageProps {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
}

type GuideSubmissionStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "changes_requested";

interface GuideSubmissionRow {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  reading_time: number | null;
  difficulty: string | null;
  status: GuideSubmissionStatus;
  moderator_note: string | null;
  updated_at: string;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(
    "en",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  ).format(date);
}

function getStatusLabel(
  status: GuideSubmissionStatus,
) {
  if (
    status ===
    "changes_requested"
  ) {
    return "Changes requested";
  }

  return (
    status.charAt(0).toUpperCase() +
    status.slice(1)
  );
}

function getStatusStyle(
  status: GuideSubmissionStatus,
) {
  switch (status) {
    case "pending":
      return "border-orange-500/30 bg-orange-500/10 text-orange-300";

    case "approved":
      return "border-green-500/30 bg-green-500/10 text-green-300";

    case "rejected":
      return "border-red-500/30 bg-red-500/10 text-red-300";

    case "changes_requested":
      return "border-purple-500/30 bg-purple-500/10 text-purple-300";

    default:
      return "border-slate-500/30 bg-slate-500/10 text-slate-300";
  }
}

export default async function MyGuideSubmissionsPage({
  searchParams,
}: MyGuideSubmissionsPageProps) {
  const {
    error,
    success,
  } = await searchParams;

  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data,
    error: submissionsError,
  } = await supabase
    .from("guide_submissions")
    .select(`
      id,
      title,
      category,
      excerpt,
      reading_time,
      difficulty,
      status,
      moderator_note,
      updated_at
    `)
    .eq("user_id", user.id)
    .order("updated_at", {
      ascending: false,
    });

  const submissions =
    (data ??
      []) as GuideSubmissionRow[];

  return (
    <main className="atlas-page min-h-[calc(100vh-4rem)] pb-14 text-white">
      <section className="border-b border-white/[0.06]">
        <div className="atlas-shell py-10 sm:py-14">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="atlas-section-label">
                Community knowledge base
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-6xl">
                My guide submissions.
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
                Write practical guides, save drafts and track
                every submission through Atlas moderation.
              </p>
            </div>

            <Link
              href="/my-guide-submissions/new"
              className="atlas-button-primary w-full sm:w-auto"
            >
              + Write a guide
            </Link>
          </div>
        </div>
      </section>

      <div className="atlas-shell pt-6">
        {success && (
          <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">
            {success}
          </div>
        )}

        {(error ||
          submissionsError) && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error ??
              submissionsError?.message ??
              "Could not load guide submissions."}
          </div>
        )}

        {submissions.length === 0 ? (
          <section className="atlas-panel p-8 text-center sm:p-12">
            <p className="atlas-section-label">
              Empty notebook
            </p>

            <h2 className="mt-3 text-3xl font-black">
              No guide submissions yet
            </h2>

            <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
              Turn your tested fixes and setup knowledge into
              a guide other handheld players can actually use.
            </p>

            <Link
              href="/my-guide-submissions/new"
              className="atlas-button-primary mt-6"
            >
              Write first guide
            </Link>
          </section>
        ) : (
          <section className="grid gap-4 lg:grid-cols-2">
            {submissions.map(
              (submission) => {
                const isEditable =
                  submission.status ===
                    "draft" ||
                  submission.status ===
                    "rejected" ||
                  submission.status ===
                    "changes_requested";

                return (
                  <article
                    key={submission.id}
                    className="atlas-card atlas-card-hover min-w-0 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[0.58rem] font-black uppercase tracking-[0.14em] text-cyan-400">
                          {submission.category}
                        </p>

                        <h2 className="mt-2 break-words text-2xl font-black">
                          {submission.title}
                        </h2>
                      </div>

                      <span
                        className={`rounded-full border px-3 py-1 text-[0.56rem] font-black uppercase tracking-[0.1em] ${getStatusStyle(
                          submission.status,
                        )}`}
                      >
                        {getStatusLabel(
                          submission.status,
                        )}
                      </span>
                    </div>

                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-400">
                      {submission.excerpt}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <GuideStat
                        label="Difficulty"
                        value={
                          submission.difficulty ??
                          "Not set"
                        }
                      />

                      <GuideStat
                        label="Reading time"
                        value={
                          submission.reading_time !==
                          null
                            ? `${submission.reading_time} min`
                            : "Not set"
                        }
                      />
                    </div>

                    {submission.moderator_note && (
                      <div className="mt-4 rounded-xl border border-purple-500/25 bg-purple-500/[0.07] p-4">
                        <p className="text-[0.56rem] font-black uppercase tracking-[0.12em] text-purple-300">
                          Moderator note
                        </p>

                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          {submission.moderator_note}
                        </p>
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
                      <p className="text-xs text-slate-600">
                        Updated{" "}
                        {formatDate(
                          submission.updated_at,
                        )}
                      </p>

                      {isEditable ? (
                        <Link
                          href={`/my-guide-submissions/${submission.id}/edit`}
                          className="text-xs font-black uppercase tracking-[0.1em] text-cyan-400 transition hover:text-white"
                        >
                          Edit guide →
                        </Link>
                      ) : (
                        <span className="text-xs font-black uppercase tracking-[0.1em] text-slate-500">
                          Locked for review
                        </span>
                      )}
                    </div>
                  </article>
                );
              },
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function GuideStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-white/[0.07] bg-black/20 p-3">
      <p className="text-[0.46rem] font-black uppercase tracking-[0.09em] text-slate-600">
        {label}
      </p>

      <p className="mt-1 break-words text-xs font-black text-slate-300">
        {value}
      </p>
    </div>
  );
}
