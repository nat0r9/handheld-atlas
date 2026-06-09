import { redirect } from "next/navigation";
import SubmissionForm, {
  type SubmissionSelectOption,
} from "../../../components/community/SubmissionForm";
import { createClient } from "../../../lib/supabase/server";
import { createSubmission } from "../actions";

interface NewSubmissionPageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

export default async function NewSubmissionPage({
  searchParams,
}: NewSubmissionPageProps) {
  const { error } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: games, error: gamesError },
    { data: handhelds, error: handheldsError },
  ] = await Promise.all([
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
          <p className="atlas-section-label">
            Community workshop
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-6xl">
            Build a preset.
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
            Share settings you have actually tested.
            Save a draft first or submit the completed
            preset to the moderation queue.
          </p>
        </div>
      </section>

      <div className="atlas-shell pt-6">
        {(error || databaseError) && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error ??
              databaseError ??
              "Could not load the submission form."}
          </div>
        )}

        <SubmissionForm
          games={gameOptions}
          handhelds={handheldOptions}
          action={createSubmission}
        />
      </div>
    </main>
  );
}
