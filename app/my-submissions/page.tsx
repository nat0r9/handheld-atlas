import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

interface MySubmissionsPageProps {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
}

interface SubmissionRow {
  id: string;
  name: string;
  preset_type: string;
  resolution: string | null;
  tdp: string | null;
  fps_average: number | null;
  status:
    | "draft"
    | "pending"
    | "approved"
    | "rejected"
    | "changes_requested";
  moderator_note: string | null;
  updated_at: string;
  games:
    | { name: string; slug: string }
    | { name: string; slug: string }[]
    | null;
  handhelds:
    | { name: string; slug: string }
    | { name: string; slug: string }[]
    | null;
}

function relationName(
  relation: { name: string } | { name: string }[] | null,
  fallback: string,
) {
  if (!relation) {
    return fallback;
  }

  return Array.isArray(relation)
    ? relation[0]?.name ?? fallback
    : relation.name;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getStatusStyle(status: SubmissionRow["status"]) {
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

function getStatusLabel(status: SubmissionRow["status"]) {
  return status === "changes_requested"
    ? "Changes requested"
    : status.charAt(0).toUpperCase() + status.slice(1);
}

export default async function MySubmissionsPage({
  searchParams,
}: MySubmissionsPageProps) {
  const { error, success } = await searchParams;

  const supabase = await createClient();

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
    .from("preset_submissions")
    .select(`
      id,
      name,
      preset_type,
      resolution,
      tdp,
      fps_average,
      status,
      moderator_note,
      updated_at,
      games (name, slug),
      handhelds (name, slug)
    `)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const submissions =
    (data ?? []) as unknown as SubmissionRow[];

  return (
    <main className="atlas-page min-h-[calc(100vh-4rem)] pb-14 text-white">
      <section className="border-b border-white/[0.06]">
        <div className="atlas-shell py-10 sm:py-14">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="atlas-section-label">
                Community workshop
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-6xl">
                My submissions.
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
                Create, review and track your community presets
                before they enter the public Atlas database.
              </p>
            </div>

            <Link
              href="/my-submissions/new"
              className="atlas-button-primary w-full sm:w-auto"
            >
              + New preset submission
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

        {(error || submissionsError) && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error ??
              submissionsError?.message ??
              "Could not load submissions."}
          </div>
        )}

        {submissions.length === 0 ? (
          <section className="atlas-panel p-8 text-center sm:p-12">
            <p className="atlas-section-label">
              Empty workshop
            </p>

            <h2 className="mt-3 text-3xl font-black">
              No preset submissions yet
            </h2>

            <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
              Build your first handheld preset and either save
              it as a draft or send it to the moderation queue.
            </p>

            <Link
              href="/my-submissions/new"
              className="atlas-button-primary mt-6"
            >
              Create first submission
            </Link>
          </section>
        ) : (
          <section className="grid gap-4 lg:grid-cols-2">
            {submissions.map((submission) => (
              <article
                key={submission.id}
                className="atlas-card atlas-card-hover min-w-0 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[0.58rem] font-black uppercase tracking-[0.14em] text-cyan-400">
                      {relationName(
                        submission.games,
                        "Unknown game",
                      )}
                    </p>

                    <h2 className="mt-2 break-words text-2xl font-black">
                      {submission.name}
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                      {relationName(
                        submission.handhelds,
                        "Unknown handheld",
                      )}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-[0.56rem] font-black uppercase tracking-[0.1em] ${getStatusStyle(
                      submission.status,
                    )}`}
                  >
                    {getStatusLabel(submission.status)}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <SubmissionStat
                    label="Type"
                    value={submission.preset_type}
                  />
                  <SubmissionStat
                    label="Resolution"
                    value={submission.resolution ?? "Not set"}
                  />
                  <SubmissionStat
                    label="TDP"
                    value={submission.tdp ?? "Not set"}
                  />
                  <SubmissionStat
                    label="Average"
                    value={
                      submission.fps_average !== null
                        ? `${submission.fps_average} FPS`
                        : "Not set"
                    }
                    highlighted
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
                    Updated {formatDate(submission.updated_at)}
                  </p>

                  {submission.status === "draft" ||
                  submission.status === "rejected" ||
                  submission.status === "changes_requested" ? (
                    <Link
                      href={`/my-submissions/${submission.id}/edit`}
                      className="text-xs font-black uppercase tracking-[0.1em] text-cyan-400 transition hover:text-white"
                    >
                      Edit submission →
                    </Link>
                  ) : (
                    <span className="text-xs font-black uppercase tracking-[0.1em] text-slate-500">
                      Locked for review
                    </span>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function SubmissionStat({
  label,
  value,
  highlighted = false,
}: {
  label: string;
  value: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-lg border p-3 ${
        highlighted
          ? "border-red-500/25 bg-red-500/[0.07]"
          : "border-white/[0.07] bg-black/20"
      }`}
    >
      <p className="text-[0.46rem] font-black uppercase tracking-[0.09em] text-slate-600">
        {label}
      </p>

      <p
        className={`mt-1 break-words text-xs font-black ${
          highlighted ? "text-red-400" : "text-slate-300"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
