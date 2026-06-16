import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import SubmissionForm, {
  type SubmissionInitialData,
  type SubmissionSelectOption,
} from "../../../../components/community/SubmissionForm";
import {
  getSubmissionStatusClassName,
  getSubmissionStatusDescription,
  getSubmissionStatusLabel,
  isSubmissionEditable,
  type SubmissionStatus,
} from "../../../../lib/submission-workflow";
import { createClient } from "../../../../lib/supabase/server";
import {
  deleteSubmission,
  updateSubmission,
} from "../../actions";

interface EditSubmissionPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
}

interface DatabaseSubmissionGroup {
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

interface DatabaseSubmission {
  id: string;
  user_id: string;
  game_id: string;
  handheld_id: string;
  name: string;
  preset_type:
    | "Performance"
    | "Balanced"
    | "Battery"
    | "Docked"
    | "Custom";
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
  settings_draft: unknown;
  preset_submission_groups: DatabaseSubmissionGroup[];
}

function parseSettingsDraft(
  value: unknown,
): SubmissionInitialData["groups"] {
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

          return {
            id: `draft-item-${groupIndex}-${itemIndex}`,
            label:
              typeof itemRecord.label === "string"
                ? itemRecord.label
                : "",
            value:
              typeof itemRecord.value === "string"
                ? itemRecord.value
                : "",
            note:
              typeof itemRecord.note === "string"
                ? itemRecord.note
                : "",
          };
        })
        .filter(
          (
            item,
          ): item is NonNullable<typeof item> => item !== null,
        );

      return {
        id: `draft-group-${groupIndex}`,
        name:
          typeof groupRecord.name === "string"
            ? groupRecord.name
            : "",
        items:
          items.length > 0
            ? items
            : [
                {
                  id: `draft-item-${groupIndex}-0`,
                  label: "",
                  value: "",
                  note: "",
                },
              ],
      };
    })
    .filter(
      (
        group,
      ): group is NonNullable<typeof group> => group !== null,
    );
}

export default async function EditSubmissionPage({
  params,
  searchParams,
}: EditSubmissionPageProps) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: submissionData, error: submissionError },
    { data: games, error: gamesError },
    { data: handhelds, error: handheldsError },
  ] = await Promise.all([
    supabase
      .from("preset_submissions")
      .select(`
        id,
        user_id,
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
        settings_draft,
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
      .from("games")
      .select("id, name")
      .eq("status", "published")
      .order("name"),
    supabase
      .from("handhelds")
      .select("id, name")
      .eq("status", "published")
      .order("name"),
  ]);

  if (submissionError || !submissionData) {
    notFound();
  }

  const submission =
    submissionData as unknown as DatabaseSubmission;

  if (!isSubmissionEditable(submission.status)) {
    redirect(
      `/my-submissions/${id}?error=This%20submission%20is%20locked%20for%20review`,
    );
  }

  const draftGroups = parseSettingsDraft(
    submission.settings_draft,
  );
  const normalizedGroups: SubmissionInitialData["groups"] = [
    ...(submission.preset_submission_groups ?? []),
  ]
    .sort(
      (first, second) => first.sort_order - second.sort_order,
    )
    .map((group) => ({
      id: group.id,
      name: group.name,
      items: [...(group.preset_submission_items ?? [])]
        .sort(
          (first, second) =>
            first.sort_order - second.sort_order,
        )
        .map((item) => ({
          id: item.id,
          label: item.label,
          value: item.value,
          note: item.note ?? "",
        })),
    }));

  const initialData: SubmissionInitialData = {
    id: submission.id,
    gameId: submission.game_id,
    handheldId: submission.handheld_id,
    name: submission.name,
    presetType: submission.preset_type,
    resolution: submission.resolution ?? "",
    tdp: submission.tdp ?? "",
    fpsAverage: submission.fps_average?.toString() ?? "",
    onePercentLow:
      submission.one_percent_low?.toString() ?? "",
    upscaler: submission.upscaler ?? "",
    batteryLife: submission.battery_life ?? "",
    summary: submission.summary ?? "",
    groups:
      draftGroups.length > 0 ? draftGroups : normalizedGroups,
  };

  const gameOptions =
    (games ?? []) as SubmissionSelectOption[];
  const handheldOptions =
    (handhelds ?? []) as SubmissionSelectOption[];
  const databaseError =
    gamesError?.message ?? handheldsError?.message ?? null;

  return (
    <main className="atlas-page min-h-[calc(100vh-4rem)] pb-14 text-white">
      <section className="border-b border-white/[0.06]">
        <div className="atlas-shell py-10 sm:py-14">
          <Link
            href={`/my-submissions/${submission.id}`}
            className="text-xs font-black uppercase tracking-[0.14em] text-cyan-400 transition hover:text-white"
          >
            ← Back to submission
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <p className="atlas-section-label">
              Community workshop
            </p>

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
          </div>

          <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-6xl">
            Edit submission.
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
            {getSubmissionStatusDescription(submission.status)}
          </p>
        </div>
      </section>

      <div className="atlas-shell pt-6">
        {(error || databaseError) && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error ??
              databaseError ??
              "Could not load the submission."}
          </div>
        )}

        {submission.moderator_note && (
          <div className="mb-5 rounded-xl border border-purple-500/30 bg-purple-500/10 p-5">
            <p className="text-[0.58rem] font-black uppercase tracking-[0.14em] text-purple-300">
              Moderator note for revision {submission.revision_number}
            </p>

            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-300">
              {submission.moderator_note}
            </p>
          </div>
        )}

        <SubmissionForm
          games={gameOptions}
          handhelds={handheldOptions}
          action={updateSubmission}
          initialData={initialData}
          mode="edit"
        />

        <section className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5">
          <p className="text-sm font-black text-red-300">
            Delete submission
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            This permanently removes the draft, its workflow history and every attached settings group.
          </p>

          <form action={deleteSubmission} className="mt-4">
            <input
              type="hidden"
              name="submissionId"
              value={submission.id}
            />

            <button
              type="submit"
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-black text-red-400 transition hover:bg-red-500 hover:text-white"
            >
              Delete submission
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
