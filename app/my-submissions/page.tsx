import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getSubmissionStatusClassName,
  getSubmissionStatusDescription,
  getSubmissionStatusLabel,
  isSubmissionEditable,
  SUBMISSION_STATUSES,
  type SubmissionStatus,
} from "../../lib/submission-workflow";
import { createClient } from "../../lib/supabase/server";

interface MySubmissionsPageProps {
  searchParams: Promise<{
    error?: string;
    success?: string;
    status?: string;
  }>;
}

interface SubmissionRow {
  id: string;
  name: string;
  preset_type: string;
  resolution: string | null;
  tdp: string | null;
  fps_average: number | null;
  status: SubmissionStatus;
  revision_number: number;
  published_preset_id: string | null;
  moderator_note: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
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

function formatDate(value: string | null) {
  if (!value) {
    return "Not recorded";
  }

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

export default async function MySubmissionsPage({
  searchParams,
}: MySubmissionsPageProps) {
  const { error, success, status } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error: submissionsError } = await supabase
    .from("preset_submissions")
    .select(`
      id,
      name,
      preset_type,
      resolution,
      tdp,
      fps_average,
      status,
      revision_number,
      published_preset_id,
      moderator_note,
      submitted_at,
      reviewed_at,
      updated_at,
      games (name, slug),
      handhelds (name, slug)
    `)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const submissions =
    (data ?? []) as unknown as SubmissionRow[];
  const selectedStatus = SUBMISSION_STATUSES.includes(
    status as SubmissionStatus,
  )
    ? (status as SubmissionStatus)
    : null;
  const visibleSubmissions = selectedStatus
    ? submissions.filter(
        (submission) => submission.status === selectedStatus,
      )
    : submissions;
  const counts = new Map<SubmissionStatus, number>(
    SUBMISSION_STATUSES.map((submissionStatus) => [
      submissionStatus,
      submissions.filter(
        (submission) => submission.status === submissionStatus,
      ).length,
    ]),
  );
  const actionRequiredCount =
    (counts.get("changes_requested") ?? 0) +
    (counts.get("rejected") ?? 0);

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
                Build tested presets, follow every review round and jump directly to the published result once moderation is complete.
              </p>
            </div>

            <div className="grid w-full gap-3 sm:flex sm:w-auto">
              <Link
                href="/my-submissions/new"
                className="atlas-button-primary w-full sm:w-auto"
              >
                + New preset
              </Link>

              <Link
                href="/my-guide-submissions/new"
                className="atlas-button-secondary w-full sm:w-auto"
              >
                + New guide
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="atlas-shell pt-6">
        <section className="mb-6 grid gap-3 md:grid-cols-2">
          <Link
            href="/my-submissions"
            className="rounded-2xl border border-red-500/30 bg-red-500/[0.08] p-5 transition hover:border-red-400 hover:bg-red-500/[0.12]"
          >
            <p className="text-[0.58rem] font-black uppercase tracking-[0.14em] text-red-400">
              Preset workshop
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Preset submissions
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Draft, submit, withdraw, revise and track publication from one workflow.
            </p>
            <span className="mt-4 inline-block text-xs font-black uppercase tracking-[0.1em] text-red-400">
              Current section
            </span>
          </Link>

          <Link
            href="/my-guide-submissions"
            className="rounded-2xl border border-white/[0.08] bg-black/20 p-5 transition hover:border-cyan-500/40 hover:bg-cyan-500/[0.05]"
          >
            <p className="text-[0.58rem] font-black uppercase tracking-[0.14em] text-cyan-400">
              Knowledge base
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Guide submissions
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Write practical guides, respond to feedback and share community knowledge.
            </p>
            <span className="mt-4 inline-block text-xs font-black uppercase tracking-[0.1em] text-cyan-400">
              Open my guides →
            </span>
          </Link>
        </section>

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

        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            label="All presets"
            value={submissions.length}
            description="Across every workflow state"
          />
          <SummaryCard
            label="In review"
            value={counts.get("pending") ?? 0}
            description="Locked in moderation"
          />
          <SummaryCard
            label="Needs action"
            value={actionRequiredCount}
            description="Changes requested or rejected"
          />
          <SummaryCard
            label="Published"
            value={counts.get("approved") ?? 0}
            description="Live in the Atlas"
          />
        </section>

        <nav className="mb-6 flex flex-wrap gap-2">
          <Link
            href="/my-submissions"
            className={`rounded-xl border px-4 py-2.5 text-sm font-black transition ${
              selectedStatus === null
                ? "border-cyan-500 bg-cyan-500 text-slate-950"
                : "border-white/[0.08] bg-black/20 text-slate-400 hover:border-cyan-500/40 hover:text-cyan-400"
            }`}
          >
            All {submissions.length}
          </Link>

          {SUBMISSION_STATUSES.map((filterStatus) => (
            <Link
              key={filterStatus}
              href={`/my-submissions?status=${filterStatus}`}
              className={`rounded-xl border px-4 py-2.5 text-sm font-black transition ${
                selectedStatus === filterStatus
                  ? "border-cyan-500 bg-cyan-500 text-slate-950"
                  : "border-white/[0.08] bg-black/20 text-slate-400 hover:border-cyan-500/40 hover:text-cyan-400"
              }`}
            >
              {getSubmissionStatusLabel(filterStatus)}{" "}
              {counts.get(filterStatus) ?? 0}
            </Link>
          ))}
        </nav>

        {visibleSubmissions.length === 0 ? (
          <section className="atlas-panel p-8 text-center sm:p-12">
            <p className="atlas-section-label">Empty workshop</p>
            <h2 className="mt-3 text-3xl font-black">
              No submissions in this state
            </h2>
            <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
              Create a new preset or switch the filter. The goblins have not eaten anything; this shelf is simply empty.
            </p>
            <Link
              href="/my-submissions/new"
              className="atlas-button-primary mt-6"
            >
              Create submission
            </Link>
          </section>
        ) : (
          <section className="grid gap-4 lg:grid-cols-2">
            {visibleSubmissions.map((submission) => {
              const editable = isSubmissionEditable(
                submission.status,
              );

              return (
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
                      className={`rounded-full border px-3 py-1 text-[0.58rem] font-black uppercase tracking-[0.1em] ${getSubmissionStatusClassName(
                        submission.status,
                      )}`}
                    >
                      {getSubmissionStatusLabel(submission.status)}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-500">
                    {getSubmissionStatusDescription(submission.status)}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <MiniStat
                      label="Revision"
                      value={String(submission.revision_number)}
                    />
                    <MiniStat
                      label="Profile"
                      value={submission.preset_type}
                    />
                    <MiniStat
                      label="Target"
                      value={submission.resolution ?? "Not set"}
                    />
                    <MiniStat
                      label="Average"
                      value={
                        submission.fps_average !== null
                          ? `${submission.fps_average} FPS`
                          : "Not set"
                      }
                    />
                  </div>

                  {submission.moderator_note &&
                    ["changes_requested", "rejected"].includes(
                      submission.status,
                    ) && (
                      <div className="mt-4 rounded-xl border border-purple-500/20 bg-purple-500/[0.06] p-4">
                        <p className="text-[0.55rem] font-black uppercase tracking-[0.12em] text-purple-300">
                          Moderator note
                        </p>
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">
                          {submission.moderator_note}
                        </p>
                      </div>
                    )}

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
                    <p className="text-xs text-slate-600">
                      Updated {formatDate(submission.updated_at)}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {editable && (
                        <Link
                          href={`/my-submissions/${submission.id}/edit`}
                          className="atlas-button-secondary"
                        >
                          {submission.status === "draft"
                            ? "Continue editing"
                            : "Revise preset"}
                        </Link>
                      )}

                      {submission.published_preset_id && (
                        <Link
                          href={`/presets/${submission.published_preset_id}`}
                          className="atlas-button-secondary"
                        >
                          Public preset
                        </Link>
                      )}

                      <Link
                        href={`/my-submissions/${submission.id}`}
                        className="atlas-button-primary"
                      >
                        View workflow
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="atlas-panel p-4 sm:p-5">
      <p className="text-[0.55rem] font-black uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">
        {description}
      </p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
      <p className="text-[0.5rem] font-black uppercase tracking-[0.1em] text-slate-600">
        {label}
      </p>
      <p className="mt-2 truncate text-sm font-black text-slate-300">
        {value}
      </p>
    </div>
  );
}
