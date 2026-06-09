import { redirect } from "next/navigation";
import GuideSubmissionForm, {
  type GuideRelationOption,
} from "../../../components/community/GuideSubmissionForm";
import { createClient } from "../../../lib/supabase/server";
import { createGuideSubmission } from "../actions";

interface NewGuideSubmissionPageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

export default async function NewGuideSubmissionPage({
  searchParams,
}: NewGuideSubmissionPageProps) {
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
      data: games,
      error: gamesError,
    },
    {
      data: handhelds,
      error: handheldsError,
    },
  ] = await Promise.all([
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
          <p className="atlas-section-label">
            Community knowledge base
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-6xl">
            Write a guide.
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
            Share tested fixes, setup workflows and practical
            handheld knowledge without twenty paragraphs of SEO sludge.
          </p>
        </div>
      </section>

      <div className="atlas-shell pt-6">
        {(error ||
          databaseError) && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error ??
              databaseError ??
              "Could not load the guide form."}
          </div>
        )}

        <GuideSubmissionForm
          games={gameOptions}
          handhelds={
            handheldOptions
          }
          action={
            createGuideSubmission
          }
        />
      </div>
    </main>
  );
}
