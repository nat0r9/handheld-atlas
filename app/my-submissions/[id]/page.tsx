import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import SubmissionReadinessPanel from "../../../components/community/SubmissionReadinessPanel";
import SubmissionTimeline, {
  type SubmissionTimelineEvent,
} from "../../../components/community/SubmissionTimeline";
import {
  getSubmissionReadiness,
  getSubmissionStatusClassName,
  getSubmissionStatusDescription,
  getSubmissionStatusLabel,
  isSubmissionEditable,
  type SubmissionEventType,
  type SubmissionStatus,
} from "../../../lib/submission-workflow";
import { createClient } from "../../../lib/supabase/server";
import { withdrawSubmission } from "../actions";

interface SubmissionDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
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
  game_id: string;
  handheld_id: string;
  name: string;
  preset_type: string;
  resolution: string | null;
  tdp: string | null;
  fps_average: number | null;
  one_percent_low: number | null;
  upscaler: string | null;
  battery_life: string | null;
  summary: string | null;
  status: SubmissionStatus;
  revision_number: number;
  moderator_note: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  updated_at: string;
  published_preset_id: string | null;
  settings_draft: unknown;
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

interface EventRow {
  id: string;
  actor_id: string | null;
  event_type: SubmissionEventType;
  note: string | null;
  revision_number: number;
  created_at: string;
}

interface ProfileRow {
  id: string;
  display_name: string | null;
  email: string | null;
}

function parseDraftDisplayGroups(value: unknown): DetailGroup[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((group, groupIndex) => {
      if (typeof group !== "object" || group === null) {
        return null;
      }

      const groupRecord = group as Record<string, unknown>;
      const rawItems = Array.isArray(groupRecord.items)
        ? groupRecord.items
        : [];
      const items = rawItems
        .map((item, itemIndex) => {
          if (typeof item !== "object" || item === null) {
            return null;
          }

          const itemRecord = item as Record<string, unknown>;
          const label =
            typeof itemRecord.label === "string"
              ? itemRecord.label.trim()
              : "";
          const itemValue =
            typeof itemRecord.value === "string"
              ? itemRecord.value.trim()
              : "";
          const note =
            typeof itemRecord.note === "string"
              ? itemRecord.note.trim()
              : "";

          if (!label && !itemValue && !note) {
            return null;
          }

          return {
            id: `draft-item-${groupIndex}-${itemIndex}`,
            label: label || "Incomplete setting",
            value: itemValue || "Not set",
            note: note || null,
            sort_order: itemIndex,
          };
        })
        .filter(
          (item): item is NonNullable<typeof item> => item !== null,
        );
      const name =
        typeof groupRecord.name === "string"
          ? groupRecord.name.trim()
          : "";

      if (!name && items.length === 0) {
        return null;
      }

      return {
        id: `draft-group-${groupIndex}`,
        name: name || "Unnamed group",
        sort_order: groupIndex,
        preset_submission_items: items,
      };
    })
    .filter(
      (group): group is NonNullable<typeof group> => group !== null,
    );
}

function relationValue<T>(relation: T | T[] | null): T | null {
  if (!relation) {
    return null;
  }

  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not recorded";
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

export default async function SubmissionDetailPage({
  params,
  searchParams,
}: SubmissionDetailPageProps) {
  const { id } = await params;
  const { error, success } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [submissionResult, eventsResult] = await Promise.all([
    supabase
      .from("preset_submissions")
      .select(`
        id,
        game_id,
        handheld_id,
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
        revision_number,
        moderator_note,
        submitted_at,
        reviewed_at,
        updated_at,
        published_preset_id,
        settings_draft,
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
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("preset_submission_events")
      .select(
        "id, actor_id, event_type, note, revision_number, created_at",
      )
      .eq("submission_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (submissionResult.error || !submissionResult.data) {
    notFound();
  }

  const submission =
    submissionResult.data as unknown as DetailSubmission;
  const normalizedGroups = [
    ...(submission.preset_submission_groups ?? []),
  ]
    .sort(
      (first, second) => first.sort_order - second.sort_order,
    )
    .map((group) => ({
      ...group,
      preset_submission_items: [
        ...(group.preset_submission_items ?? []),
      ].sort(
        (first, second) =>
          first.sort_order - second.sort_order,
      ),
    }));
  const draftDisplayGroups = parseDraftDisplayGroups(
    submission.settings_draft,
  );
  const groups =
    draftDisplayGroups.length > 0
      ? draftDisplayGroups
      : normalizedGroups;

  const readiness = getSubmissionReadiness({
    gameId: submission.game_id,
    handheldId: submission.handheld_id,
    name: submission.name,
    resolution: submission.resolution ?? "",
    tdp: submission.tdp ?? "",
    fpsAverage: submission.fps_average,
    onePercentLow: submission.one_percent_low,
    batteryLife: submission.battery_life ?? "",
    summary: submission.summary ?? "",
    groups: groups.map((group) => ({
      name: group.name,
      items: group.preset_submission_items.map((item) => ({
        label: item.label,
        value: item.value,
      })),
    })),
  });

  const eventRows = (eventsResult.data ?? []) as EventRow[];
  const actorIds = Array.from(
    new Set(
      eventRows
        .map((event) => event.actor_id)
        .filter((actorId): actorId is string => Boolean(actorId)),
    ),
  );

  let profiles: ProfileRow[] = [];

  if (actorIds.length > 0) {
    const profileResult = await supabase
      .from("profiles")
      .select("id, display_name, email")
      .in("id", actorIds);

    profiles = (profileResult.data ?? []) as ProfileRow[];
  }

  const profileMap = new Map(
    profiles.map((profile) => [profile.id, profile]),
  );

  const timelineEvents: SubmissionTimelineEvent[] = eventRows.map(
    (event) => {
      const actor = event.actor_id
        ? profileMap.get(event.actor_id)
        : null;

      return {
        id: event.id,
        eventType: event.event_type,
        note: event.note,
        revisionNumber: event.revision_number,
        createdAt: event.created_at,
        actorName:
          actor?.display_name ?? actor?.email ?? null,
      };
    },
  );

  const game = relationValue(submission.games);
  const handheld = relationValue(submission.handhelds);
  const editable = isSubmissionEditable(submission.status);

  return (
    <main className="atlas-page min-h-[calc(100vh-4rem)] pb-14 text-white">
      <section className="border-b border-white/[0.06]">
        <div className="atlas-shell py-10 sm:py-14">
          <Link
            href="/my-submissions"
            className="text-xs font-black uppercase tracking-[0.14em] text-cyan-400 transition hover:text-white"
          >
            ← Back to submissions
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full border px-3 py-1 text-[0.58rem] font-black uppercase tracking-[0.1em] ${getSubmissionStatusClassName(
                submission.status,
              )}`}
            >
              {getSubmissionStatusLabel(submission.status)}
            </span>

            <span className="rounded-full border border-white/[0.08] bg-black/20 px-3 py-1 text-[0.58rem] font-black uppercase tracking-[0.1em] text-slate-500">
              Revision {submission.revision_number}
            </span>

            <span className="rounded-full border border-cyan-500/20 bg-cyan-500/[0.06] px-3 py-1 text-[0.58rem] font-black uppercase tracking-[0.1em] text-cyan-400">
              {submission.preset_type}
            </span>
          </div>

          <h1 className="mt-4 max-w-5xl break-words text-4xl font-black tracking-[-0.05em] sm:text-6xl">
            {submission.name}
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
            {getSubmissionStatusDescription(submission.status)}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {editable && (
              <Link
                href={`/my-submissions/${submission.id}/edit`}
                className="atlas-button-primary"
              >
                Edit submission
              </Link>
            )}

            {submission.status === "pending" && (
              <form action={withdrawSubmission}>
                <input
                  type="hidden"
                  name="submissionId"
                  value={submission.id}
                />

                <button
                  type="submit"
                  className="atlas-button-secondary"
                >
                  Withdraw to draft
                </button>
              </form>
            )}

            {submission.published_preset_id && (
              <Link
                href={`/presets/${submission.published_preset_id}`}
                className="atlas-button-primary"
              >
                Open published preset
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="atlas-shell pt-6">
        {success && (
          <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">
            {success}
          </div>
        )}

        {(error || eventsResult.error) && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error ??
              eventsResult.error?.message ??
              "Could not load the complete submission history."}
          </div>
        )}

        {submission.moderator_note && (
          <section className="mb-5 rounded-2xl border border-purple-500/30 bg-purple-500/[0.08] p-5 sm:p-6">
            <p className="text-[0.58rem] font-black uppercase tracking-[0.14em] text-purple-300">
              Moderator note
            </p>

            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-300">
              {submission.moderator_note}
            </p>
          </section>
        )}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-5">
            <section className="atlas-panel p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="atlas-section-label">
                    Submitted target
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    {game?.name ?? "Unknown game"}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    {handheld?.name ?? "Unknown handheld"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {game && (
                    <Link
                      href={`/games/${game.slug}`}
                      className="atlas-button-secondary"
                    >
                      Game page
                    </Link>
                  )}

                  {handheld && (
                    <Link
                      href={`/handhelds/${handheld.slug}`}
                      className="atlas-button-secondary"
                    >
                      Handheld page
                    </Link>
                  )}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
                <Stat
                  label="Resolution"
                  value={submission.resolution ?? "Not set"}
                />
                <Stat label="TDP" value={submission.tdp ?? "Not set"} />
                <Stat
                  label="Average FPS"
                  value={
                    submission.fps_average !== null
                      ? `${submission.fps_average} FPS`
                      : "Not set"
                  }
                />
                <Stat
                  label="1% Low"
                  value={
                    submission.one_percent_low !== null
                      ? `${submission.one_percent_low} FPS`
                      : "Not set"
                  }
                />
                <Stat
                  label="Upscaler"
                  value={submission.upscaler ?? "Not set"}
                />
                <Stat
                  label="Battery"
                  value={submission.battery_life ?? "Not set"}
                />
              </div>

              <div className="mt-6 border-t border-white/[0.07] pt-5">
                <p className="text-[0.58rem] font-black uppercase tracking-[0.14em] text-slate-600">
                  Summary
                </p>

                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-300">
                  {submission.summary ?? "No summary supplied."}
                </p>
              </div>
            </section>

            <section className="atlas-panel p-5 sm:p-6">
              <p className="atlas-section-label">Detailed settings</p>

              <h2 className="mt-2 text-2xl font-black">
                Submitted configuration
              </h2>

              <div className="mt-5 space-y-4">
                {groups.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/[0.08] p-6 text-center text-slate-500">
                    No detailed settings supplied.
                  </p>
                ) : (
                  groups.map((group) => (
                    <section
                      key={group.id}
                      className="overflow-hidden rounded-2xl border border-white/[0.07] bg-black/20"
                    >
                      <h3 className="border-b border-white/[0.07] px-5 py-4 text-lg font-black">
                        {group.name}
                      </h3>

                      <dl>
                        {group.preset_submission_items.map(
                          (item, index) => (
                            <div
                              key={item.id}
                              className={`grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-5 py-4 ${
                                index ===
                                group.preset_submission_items.length - 1
                                  ? ""
                                  : "border-b border-white/[0.06]"
                              }`}
                            >
                              <div className="min-w-0">
                                <dt className="break-words font-bold text-slate-300">
                                  {item.label}
                                </dt>

                                {item.note && (
                                  <p className="mt-1 whitespace-pre-line break-words text-xs leading-5 text-slate-600">
                                    {item.note}
                                  </p>
                                )}
                              </div>

                              <dd className="max-w-44 break-words text-right font-black text-cyan-400">
                                {item.value}
                              </dd>
                            </div>
                          ),
                        )}
                      </dl>
                    </section>
                  ))
                )}
              </div>
            </section>

            <SubmissionTimeline events={timelineEvents} />
          </div>

          <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
            <SubmissionReadinessPanel
              readiness={readiness}
              compact
            />

            <section className="atlas-panel p-5">
              <p className="atlas-section-label">Workflow details</p>

              <dl className="mt-4 space-y-4">
                <WorkflowRow
                  label="Current revision"
                  value={String(submission.revision_number)}
                />
                <WorkflowRow
                  label="Last updated"
                  value={formatDate(submission.updated_at)}
                />
                <WorkflowRow
                  label="Submitted"
                  value={formatDate(submission.submitted_at)}
                />
                <WorkflowRow
                  label="Reviewed"
                  value={formatDate(submission.reviewed_at)}
                />
              </dl>
            </section>

            {submission.status === "pending" && (
              <section className="rounded-2xl border border-orange-500/20 bg-orange-500/[0.06] p-5">
                <p className="text-sm font-black text-orange-300">
                  Revision locked
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Withdraw it to draft before editing. The timeline keeps a record of the withdrawal and future resubmission.
                </p>
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
      <p className="text-[0.52rem] font-black uppercase tracking-[0.1em] text-slate-600">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-black text-slate-300">
        {value}
      </p>
    </div>
  );
}

function WorkflowRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] pb-4 last:border-0 last:pb-0">
      <dt className="text-xs font-black uppercase tracking-[0.1em] text-slate-600">
        {label}
      </dt>
      <dd className="text-right text-sm font-black text-slate-300">
        {value}
      </dd>
    </div>
  );
}
