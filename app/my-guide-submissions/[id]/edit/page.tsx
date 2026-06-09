import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";
import GuideSubmissionForm, {
  type GuideRelationOption,
  type GuideSubmissionInitialData,
} from "../../../../components/community/GuideSubmissionForm";
import { createClient } from "../../../../lib/supabase/server";
import {
  deleteGuideSubmission,
  updateGuideSubmission,
} from "../../actions";

interface EditGuideSubmissionPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
}

interface DatabaseGuideSubmission {
  id: string;
  user_id: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  reading_time: number | null;
  difficulty: string | null;
  cover_image_url: string | null;
  related_game_slug: string | null;
  related_handheld_slug: string | null;
  status:
    | "draft"
    | "pending"
    | "approved"
    | "rejected"
    | "changes_requested";
  moderator_note: string | null;
}

export default async function EditGuideSubmissionPage({
  params,
  searchParams,
}: EditGuideSubmissionPageProps) {
  const { id } = await params;
  const { error } =
    await searchParams;

  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    {
      data: submissionData,
      error: submissionError,
    },
    {
      data: games,
      error: gamesError,
    },
    {
      data: handhelds,
      error: handheldsError,
    },
  ] = await Promise.all([
    supabase
      .from("guide_submissions")
      .select(`
        id,
        user_id,
        title,
        category,
        excerpt,
        content,
        reading_time,
        difficulty,
        cover_image_url,
        related_game_slug,
        related_handheld_slug,
        status,
        moderator_note
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle(),

    supabase
      .from("games")
      .select("name, slug")
      .eq("status", "published")
      .order("name"),

    supabase
      .from("handhelds")
      .select("name, slug")
      .eq("status", "published")
      .order("name"),
  ]);

  if (
    submissionError ||
    !submissionData
  ) {
    notFound();
  }

  const submission =
    submissionData as DatabaseGuideSubmission;

  if (
    ![
      "draft",
      "rejected",
      "changes_requested",
    ].includes(submission.status)
  ) {
    redirect(
      "/my-guide-submissions?error=This%20guide%20submission%20is%20locked%20for%20review",
    );
  }

  const initialData:
    GuideSubmissionInitialData = {
      id: submission.id,
      title: submission.title,
      category:
        submission.category,
      excerpt:
        submission.excerpt,
      content:
        submission.content,
      readingTime:
        submission.reading_time?.toString() ??
        "",
      difficulty:
        submission.difficulty ?? "",
      coverImageUrl:
        submission.cover_image_url ??
        "",
      relatedGameSlug:
        submission.related_game_slug ??
        "",
      relatedHandheldSlug:
        submission.related_handheld_slug ??
        "",
    };

  const gameOptions =
    (games ??
      []) as GuideRelationOption[];

  const handheldOptions =
    (handhelds ??
      []) as GuideRelationOption[];

  const databaseError =
    gamesError?.message ??
    handheldsError?.message ??
    null;

  return (
    <main className="atlas-page min-h-[calc(100vh-4rem)] pb-14 text-white">
      <section className="border-b border-white/[0.06]">
        <div className="atlas-shell py-10 sm:py-14">
          <Link
            href="/my-guide-submissions"
            className="text-xs font-black uppercase tracking-[0.14em] text-cyan-400 transition hover:text-white"
          >
            ← Back to guide submissions
          </Link>

          <p className="mt-6 atlas-section-label">
            Community knowledge base
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-6xl">
            Edit guide.
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
            Update the draft, fix moderator feedback
            and send the guide back into review.
          </p>
        </div>
      </section>

      <div className="atlas-shell pt-6">
        {(error ||
          databaseError) && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error ??
              databaseError ??
              "Could not load the guide submission."}
          </div>
        )}

        {submission.moderator_note && (
          <div className="mb-5 rounded-xl border border-purple-500/30 bg-purple-500/10 p-5">
            <p className="text-[0.58rem] font-black uppercase tracking-[0.14em] text-purple-300">
              Moderator note
            </p>

            <p className="mt-3 text-sm leading-7 text-slate-300">
              {
                submission.moderator_note
              }
            </p>
          </div>
        )}

        <GuideSubmissionForm
          games={gameOptions}
          handhelds={
            handheldOptions
          }
          action={
            updateGuideSubmission
          }
          initialData={initialData}
          mode="edit"
        />

        <section className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5">
          <p className="text-sm font-black text-red-300">
            Delete guide submission
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            This permanently removes the editable guide draft.
          </p>

          <form
            action={
              deleteGuideSubmission
            }
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
              Delete guide submission
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
