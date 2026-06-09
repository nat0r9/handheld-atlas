import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import SubmissionForm, {
  type SubmissionInitialData,
  type SubmissionSelectOption,
} from "../../../../components/community/SubmissionForm";
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
  status:
    | "draft"
    | "pending"
    | "approved"
    | "rejected"
    | "changes_requested";
  moderator_note: string | null;
  preset_submission_groups: DatabaseSubmissionGroup[];
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
        moderator_note,
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

  if (
    ![
      "draft",
      "rejected",
      "changes_requested",
    ].includes(submission.status)
  ) {
    redirect(
      "/my-submissions?error=This%20submission%20is%20locked%20for%20review",
    );
  }

  const initialData: SubmissionInitialData = {
    id: submission.id,
    gameId: submission.game_id,
    handheldId: submission.handheld_id,
    name: submission.name,
    presetType: submission.preset_type,
    resolution: submission.resolution ?? "",
    tdp: submission.tdp ?? "",
    fpsAverage:
      submission.fps_average?.toString() ?? "",
    onePercentLow:
      submission.one_percent_low?.toString() ?? "",
    upscaler: submission.upscaler ?? "",
    batteryLife: submission.battery_life ?? "",
    summary: submission.summary ?? "",
    groups: [
      ...(submission.preset_submission_groups ?? []),
    ]
      .sort(
        (first, second) =>
          first.sort_order - second.sort_order,
      )
      .map((group) => ({
        id: group.id,
        name: group.name,
        items: [
          ...(group.preset_submission_items ?? []),
        ]
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
      })),
  };

  const gameOptions =
    (games ?? []) as SubmissionSelectOption[];

  const handheldOptions =
    (handhelds ?? []) as SubmissionSelectOption[];

  const databaseError =
    gamesError?.message ??
    handheldsError?.message ??
    null;

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

          <p className="mt-6 atlas-section-label">
            Community workshop
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-6xl">
            Edit submission.
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
            Update the preset, save it as a draft or send
            the corrected version back to moderation.
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
              Moderator note
            </p>

            <p className="mt-3 text-sm leading-7 text-slate-300">
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
            This permanently removes the draft and all
            attached settings groups.
          </p>

          <form
            action={deleteSubmission}
            className="mt-4"
          >
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
