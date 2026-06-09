import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

interface AdminGuideSubmissionsPageProps {
  searchParams: Promise<{
    error?: string;
    success?: string;
    status?: string;
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
  user_id: string;
  title: string;
  category: string;
  difficulty: string | null;
  reading_time: number | null;
  status: GuideSubmissionStatus;
  submitted_at: string | null;
  updated_at: string;
}

interface ProfileRow {
  id: string;
  display_name: string | null;
  email: string | null;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not submitted";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusStyle(status: GuideSubmissionStatus) {
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

function getStatusLabel(status: GuideSubmissionStatus) {
  return status === "changes_requested"
    ? "Changes requested"
    : status.charAt(0).toUpperCase() + status.slice(1);
}

export default async function AdminGuideSubmissionsPage({
  searchParams,
}: AdminGuideSubmissionsPageProps) {
  const { error, success, status } = await searchParams;
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

  const validStatuses: GuideSubmissionStatus[] = [
    "draft",
    "pending",
    "approved",
    "rejected",
    "changes_requested",
  ];

  const selectedStatus = validStatuses.includes(
    status as GuideSubmissionStatus,
  )
    ? (status as GuideSubmissionStatus)
    : "pending";

  const { data, error: submissionsError } =
    await supabase
      .from("guide_submissions")
      .select(`
        id,
        user_id,
        title,
        category,
        difficulty,
        reading_time,
        status,
        submitted_at,
        updated_at
      `)
      .eq("status", selectedStatus)
      .order("updated_at", {
        ascending: false,
      });

  const submissions =
    (data ?? []) as GuideSubmissionRow[];

  const userIds = Array.from(
    new Set(
      submissions.map(
        (submission) => submission.user_id,
      ),
    ),
  );

  let profiles: ProfileRow[] = [];

  if (userIds.length > 0) {
    const { data: profileRows } = await supabase
      .from("profiles")
      .select("id, display_name, email")
      .in("id", userIds);

    profiles = (profileRows ?? []) as ProfileRow[];
  }

  const profileMap = new Map(
    profiles.map((row) => [row.id, row]),
  );

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin"
          className="text-xs font-black uppercase tracking-[0.16em] text-cyan-400 transition hover:text-white"
        >
          ← Back to dashboard
        </Link>

        <section className="mt-6 rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-7 md:p-10">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-yellow-400">
            Community moderation
          </p>

          <h1 className="mt-4 text-4xl font-black md:text-6xl">
            Guide submissions
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">
            Review community knowledge before it enters the public Atlas.
          </p>
        </section>

        {success && (
          <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-5 text-green-300">
            {success}
          </div>
        )}

        {(error || submissionsError) && (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
            {error ??
              submissionsError?.message ??
              "Could not load guide submissions."}
          </div>
        )}

        <nav className="mt-8 flex flex-wrap gap-2">
          {validStatuses.map((filterStatus) => (
            <Link
              key={filterStatus}
              href={`/admin/guide-submissions?status=${filterStatus}`}
              className={`rounded-xl border px-4 py-3 text-sm font-black transition ${
                filterStatus === selectedStatus
                  ? "border-cyan-500 bg-cyan-500 text-slate-950"
                  : "border-slate-800 bg-slate-900 text-slate-400 hover:border-cyan-500/40 hover:text-cyan-400"
              }`}
            >
              {getStatusLabel(filterStatus)}
            </Link>
          ))}
        </nav>

        {submissions.length === 0 ? (
          <section className="mt-6 rounded-3xl border border-dashed border-slate-800 bg-slate-900/50 p-12 text-center">
            <h2 className="text-2xl font-black">
              No {selectedStatus.replace("_", " ")} guides
            </h2>

            <p className="mt-3 text-slate-500">
              The guide queue is clear. A rare moment of peace on the internet.
            </p>
          </section>
        ) : (
          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            {submissions.map((submission) => {
              const author = profileMap.get(
                submission.user_id,
              );

              return (
                <Link
                  key={submission.id}
                  href={`/admin/guide-submissions/${submission.id}`}
                  className="group rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:-translate-y-1 hover:border-cyan-500/50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-400">
                        {submission.category}
                      </p>

                      <h2 className="mt-2 break-words text-2xl font-black">
                        {submission.title}
                      </h2>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-[0.58rem] font-black uppercase tracking-[0.1em] ${getStatusStyle(
                        submission.status,
                      )}`}
                    >
                      {getStatusLabel(submission.status)}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <InfoCell
                      label="Author"
                      value={
                        author?.display_name ??
                        author?.email ??
                        "Unknown user"
                      }
                    />
                    <InfoCell
                      label="Submitted"
                      value={formatDate(
                        submission.submitted_at,
                      )}
                    />
                    <InfoCell
                      label="Difficulty"
                      value={submission.difficulty ?? "Not set"}
                    />
                    <InfoCell
                      label="Reading time"
                      value={
                        submission.reading_time !== null
                          ? `${submission.reading_time} min`
                          : "Not set"
                      }
                    />
                  </div>

                  <p className="mt-5 text-sm font-black text-cyan-400 transition group-hover:text-white">
                    Review guide →
                  </p>
                </Link>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

function InfoCell({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-black/20 p-3">
      <p className="text-[0.52rem] font-black uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-black text-slate-300">
        {value}
      </p>
    </div>
  );
}
