import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import {
  approveSubmission,
  rejectSubmission,
  requestSubmissionChanges,
} from "../actions";

interface AdminSubmissionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
}

interface DetailGroup {
  id: string;
  name: string;
  sort_order: number;
  preset_submission_items: Array<{
    id: string;
    label: string;
    value: string;
    note: string | null;
    sort_order: number;
  }>;
}

interface DetailSubmission {
  id: string;
  user_id: string;
  name: string;
  preset_type: string;
  resolution: string | null;
  tdp: string | null;
  fps_average: number | null;
  one_percent_low: number | null;
  upscaler: string | null;
  battery_life: string | null;
  summary: string | null;
  status: string;
  moderator_note: string | null;
  submitted_at: string | null;
  games:
    | { name: string; slug: string }
    | { name: string; slug: string }[]
    | null;
  handhelds:
    | { name: string; slug: string }
    | { name: string; slug: string }[]
    | null;
  preset_submission_groups: DetailGroup[];
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

export default async function AdminSubmissionDetailPage({
  params,
  searchParams,
}: AdminSubmissionDetailPageProps) {
  const { id } = await params;
  const { error } = await searchParams;

  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const {
    data: adminProfile,
  } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!adminProfile?.is_admin) {
    redirect("/admin/login");
  }

  const {
    data,
    error: submissionError,
  } = await supabase
    .from("preset_submissions")
    .select(`
      id,
      user_id,
      name,
      preset_type,
      resolution,
      tdp,
      fps_average,
      one_percent_low,
      upscaler,
      battery_life,
      summary,
      status,
      moderator_note,
      submitted_at,
      games (name, slug),
      handhelds (name, slug),
      preset_submission_groups (
        id,
        name,
        sort_order,
        preset_submission_items (
          id,
          label,
          value,
          note,
          sort_order
        )
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (
    submissionError ||
    !data
  ) {
    notFound();
  }

  const submission =
    data as unknown as DetailSubmission;

  const {
    data: author,
  } = await supabase
    .from("profiles")
    .select(
      "display_name, email",
    )
    .eq(
      "id",
      submission.user_id,
    )
    .maybeSingle();

  const groups = [
    ...(submission
      .preset_submission_groups ??
      []),
  ]
    .sort(
      (first, second) =>
        first.sort_order -
        second.sort_order,
    )
    .map((group) => ({
      ...group,
      preset_submission_items: [
        ...(group
          .preset_submission_items ??
          []),
      ].sort(
        (first, second) =>
          first.sort_order -
          second.sort_order,
      ),
    }));

  const canModerate =
    submission.status ===
    "pending";

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin/submissions"
          className="text-xs font-black uppercase tracking-[0.16em] text-cyan-400 transition hover:text-white"
        >
          ← Back to submissions
        </Link>

        <section className="mt-6 rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-7 md:p-10">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-purple-400">
            Community submission
          </p>

          <h1 className="mt-4 break-words text-4xl font-black md:text-6xl">
            {submission.name}
          </h1>

          <p className="mt-4 text-lg text-slate-400">
            {relationName(
              submission.games,
            )} ·{" "}
            {relationName(
              submission.handhelds,
            )}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-300">
              {submission.preset_type}
            </span>

            <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-black capitalize text-orange-300">
              {submission.status.replace(
                "_",
                " ",
              )}
            </span>
          </div>
        </section>

        {error && (
  <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
    {error}
  </div>
)}

        <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-5">
            <article className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-400">
                Preset overview
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                <Stat
                  label="Resolution"
                  value={
                    submission.resolution ??
                    "Not set"
                  }
                />
                <Stat
                  label="TDP"
                  value={
                    submission.tdp ??
                    "Not set"
                  }
                />
                <Stat
                  label="Average FPS"
                  value={
                    submission.fps_average !==
                    null
                      ? `${submission.fps_average} FPS`
                      : "Not set"
                  }
                />
                <Stat
                  label="1% Low"
                  value={
                    submission.one_percent_low !==
                    null
                      ? `${submission.one_percent_low} FPS`
                      : "Not set"
                  }
                />
                <Stat
                  label="Upscaler"
                  value={
                    submission.upscaler ??
                    "Not set"
                  }
                />
                <Stat
                  label="Battery"
                  value={
                    submission.battery_life ??
                    "Not set"
                  }
                />
                <Stat
                  label="Author"
                  value={
                    author?.display_name ??
                    author?.email ??
                    "Unknown"
                  }
                  wide
                />
              </div>

              {submission.summary && (
                <div className="mt-6 border-t border-slate-800 pt-5">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-600">
                    Summary
                  </p>

                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-300">
                    {submission.summary}
                  </p>
                </div>
              )}
            </article>

            <article className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-400">
                Detailed settings
              </p>

              <div className="mt-5 space-y-4">
                {groups.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-slate-500">
                    No detailed settings supplied.
                  </p>
                ) : (
                  groups.map(
                    (group) => (
                      <section
                        key={group.id}
                        className="overflow-hidden rounded-2xl border border-slate-800 bg-black/20"
                      >
                        <h2 className="border-b border-slate-800 px-5 py-4 text-lg font-black">
                          {group.name}
                        </h2>

                        <dl>
                          {group.preset_submission_items.map(
                            (
                              item,
                              index,
                            ) => (
                              <div
                                key={
                                  item.id
                                }
                                className={`grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-5 py-4 ${
                                  index ===
                                  group
                                    .preset_submission_items
                                    .length -
                                    1
                                    ? ""
                                    : "border-b border-slate-800"
                                }`}
                              >
                                <div className="min-w-0">
                                  <dt className="break-words font-bold text-slate-300">
                                    {
                                      item.label
                                    }
                                  </dt>

                                  {item.note && (
                                    <p className="mt-1 break-words text-xs leading-5 text-slate-600">
                                      {
                                        item.note
                                      }
                                    </p>
                                  )}
                                </div>

                                <dd className="max-w-40 break-words text-right font-black text-cyan-400">
                                  {
                                    item.value
                                  }
                                </dd>
                              </div>
                            ),
                          )}
                        </dl>
                      </section>
                    ),
                  )
                )}
              </div>
            </article>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-purple-400">
                Moderation
              </p>

              {canModerate ? (
                <form className="mt-5 space-y-4">
                  <input
                    type="hidden"
                    name="submissionId"
                    value={
                      submission.id
                    }
                  />

                  <div>
                    <label
                      htmlFor="moderatorNote"
                      className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-600"
                    >
                      Moderator note
                    </label>

                    <textarea
                      id="moderatorNote"
                      name="moderatorNote"
                      rows={6}
                      defaultValue={
                        submission.moderator_note ??
                        ""
                      }
                      placeholder="Explain requested changes or the rejection reason."
                      className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                    />
                  </div>

                  <button
                    formAction={
                      approveSubmission
                    }
                    className="w-full rounded-xl bg-green-500 px-5 py-3 font-black text-slate-950 transition hover:bg-green-400"
                  >
                    Approve & publish
                  </button>

                  <button
                    formAction={
                      requestSubmissionChanges
                    }
                    className="w-full rounded-xl border border-purple-500/30 bg-purple-500/10 px-5 py-3 font-black text-purple-300 transition hover:bg-purple-500 hover:text-white"
                  >
                    Request changes
                  </button>

                  <button
                    formAction={
                      rejectSubmission
                    }
                    className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 font-black text-red-400 transition hover:bg-red-500 hover:text-white"
                  >
                    Reject submission
                  </button>
                </form>
              ) : (
                <div className="mt-4 rounded-xl border border-slate-800 bg-black/20 p-4">
                  <p className="font-black text-slate-300">
                    Review complete
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    This submission is no longer pending and cannot be moderated again.
                  </p>
                </div>
              )}
            </section>

            {submission.moderator_note && (
              <section className="rounded-3xl border border-purple-500/20 bg-purple-500/[0.06] p-5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-purple-300">
                  Existing note
                </p>

                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {
                    submission.moderator_note
                  }
                </p>
              </section>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-800 bg-black/20 p-3 ${
        wide
          ? "col-span-2"
          : ""
      }`}
    >
      <p className="text-[0.52rem] font-black uppercase tracking-[0.1em] text-slate-600">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-black text-slate-300">
        {value}
      </p>
    </div>
  );
}
