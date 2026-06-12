import Link from "next/link";
import { redirect } from "next/navigation";
import { MODERATION_ROLES } from "../../../lib/auth/roles";
import { requireRole } from "../../../lib/auth/require-role";

interface AdminSubmissionsPageProps {
  searchParams: Promise<{
    error?: string;
    success?: string;
    status?: string;
  }>;
}

type SubmissionStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "changes_requested";

interface SubmissionRow {
  id: string;
  user_id: string;
  name: string;
  preset_type: string;
  status: SubmissionStatus;
  submitted_at: string | null;
  updated_at: string;
  games:
    | { name: string }
    | { name: string }[]
    | null;
  handhelds:
    | { name: string }
    | { name: string }[]
    | null;
}

interface ProfileRow {
  id: string;
  display_name: string | null;
  email: string | null;
}

function relationName(
  relation:
    | { name: string }
    | { name: string }[]
    | null,
) {
  if (!relation) {
    return "Unknown";
  }

  return Array.isArray(relation)
    ? relation[0]?.name ??
        "Unknown"
    : relation.name;
}

function formatDate(
  value: string | null,
) {
  if (!value) {
    return "Not submitted";
  }

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
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function statusStyle(
  status: SubmissionStatus,
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

export default async function AdminSubmissionsPage({
  searchParams,
}: AdminSubmissionsPageProps) {
  const {
    error,
    success,
    status,
  } = await searchParams;

  const {
    supabase,
  } = await requireRole(
    MODERATION_ROLES,
    "/",
  );

  const validStatuses: SubmissionStatus[] =
    [
      "draft",
      "pending",
      "approved",
      "rejected",
      "changes_requested",
    ];

  const selectedStatus =
    validStatuses.includes(
      status as SubmissionStatus,
    )
      ? (status as SubmissionStatus)
      : "pending";

  const {
    data,
    error: submissionsError,
  } = await supabase
    .from("preset_submissions")
    .select(`
      id,
      user_id,
      name,
      preset_type,
      status,
      submitted_at,
      updated_at,
      games (name),
      handhelds (name)
    `)
    .eq("status", selectedStatus)
    .order("updated_at", {
      ascending: false,
    });

  const submissions =
    (data ?? []) as unknown as SubmissionRow[];

  const userIds = Array.from(
    new Set(
      submissions.map(
        (submission) =>
          submission.user_id,
      ),
    ),
  );

  let profileRows: ProfileRow[] = [];

  if (userIds.length > 0) {
    const {
      data: profiles,
    } = await supabase
      .from("profiles")
      .select(
        "id, display_name, email",
      )
      .in("id", userIds);

    profileRows =
      (profiles ??
        []) as ProfileRow[];
  }

  const profileMap =
    new Map(
      profileRows.map((row) => [
        row.id,
        row,
      ]),
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
          <p className="text-sm font-black uppercase tracking-[0.3em] text-purple-400">
            Community moderation
          </p>

          <h1 className="mt-4 text-4xl font-black md:text-6xl">
            Preset submissions
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">
            Review community settings before they enter the public Atlas.
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
              "Could not load submissions."}
          </div>
        )}

        <nav className="mt-8 flex flex-wrap gap-2">
          {validStatuses.map(
            (filterStatus) => (
              <Link
                key={filterStatus}
                href={`/admin/submissions?status=${filterStatus}`}
                className={`rounded-xl border px-4 py-3 text-sm font-black transition ${
                  filterStatus ===
                  selectedStatus
                    ? "border-cyan-500 bg-cyan-500 text-slate-950"
                    : "border-slate-800 bg-slate-900 text-slate-400 hover:border-cyan-500/40 hover:text-cyan-400"
                }`}
              >
                {filterStatus ===
                "changes_requested"
                  ? "Changes requested"
                  : filterStatus
                      .charAt(0)
                      .toUpperCase() +
                    filterStatus.slice(1)}
              </Link>
            ),
          )}
        </nav>

        {submissions.length === 0 ? (
          <section className="mt-6 rounded-3xl border border-dashed border-slate-800 bg-slate-900/50 p-12 text-center">
            <h2 className="text-2xl font-black">
              No {selectedStatus.replace(
                "_",
                " ",
              )} submissions
            </h2>

            <p className="mt-3 text-slate-500">
              The moderation queue is clear. A rare and beautiful sight.
            </p>
          </section>
        ) : (
          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            {submissions.map(
              (submission) => {
                const author =
                  profileMap.get(
                    submission.user_id,
                  );

                return (
                  <Link
                    key={submission.id}
                    href={`/admin/submissions/${submission.id}`}
                    className="group rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:-translate-y-1 hover:border-cyan-500/50"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-400">
                          {relationName(
                            submission.games,
                          )}
                        </p>

                        <h2 className="mt-2 break-words text-2xl font-black">
                          {submission.name}
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                          {relationName(
                            submission.handhelds,
                          )}
                        </p>
                      </div>

                      <span
                        className={`rounded-full border px-3 py-1 text-[0.58rem] font-black uppercase tracking-[0.1em] ${statusStyle(
                          submission.status,
                        )}`}
                      >
                        {submission.status.replace(
                          "_",
                          " ",
                        )}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-800 bg-black/20 p-3">
                        <p className="text-[0.52rem] font-black uppercase tracking-[0.12em] text-slate-600">
                          Author
                        </p>

                        <p className="mt-2 truncate text-sm font-black text-slate-300">
                          {author?.display_name ??
                            author?.email ??
                            "Unknown user"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-black/20 p-3">
                        <p className="text-[0.52rem] font-black uppercase tracking-[0.12em] text-slate-600">
                          Submitted
                        </p>

                        <p className="mt-2 text-sm font-black text-slate-300">
                          {formatDate(
                            submission.submitted_at,
                          )}
                        </p>
                      </div>
                    </div>

                    <p className="mt-5 text-sm font-black text-cyan-400 transition group-hover:text-white">
                      Review submission →
                    </p>
                  </Link>
                );
              },
            )}
          </section>
        )}
      </div>
    </main>
  );
}
