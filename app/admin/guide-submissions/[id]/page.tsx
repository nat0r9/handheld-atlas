import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MODERATION_ROLES,
} from "../../../../lib/auth/roles";
import { requireRole } from "../../../../lib/auth/require-role";
import {
  approveGuideSubmission,
  rejectGuideSubmission,
  requestGuideChanges,
} from "../actions";

interface AdminGuideSubmissionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
}

interface GuideSubmissionDetail {
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
  status: string;
  moderator_note: string | null;
}

function renderGuideContent(content: string) {
  const blocks = content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (
      lines.every((line) =>
        /^[-*•]\s+/.test(line),
      )
    ) {
      return (
        <ul
          key={index}
          className="list-disc space-y-2 pl-6 text-slate-300"
        >
          {lines.map((line, lineIndex) => (
            <li key={lineIndex}>
              {line.replace(/^[-*•]\s+/, "")}
            </li>
          ))}
        </ul>
      );
    }

    if (
      lines.every((line) =>
        /^\d+[.)]\s+/.test(line),
      )
    ) {
      return (
        <ol
          key={index}
          className="list-decimal space-y-2 pl-6 text-slate-300"
        >
          {lines.map((line, lineIndex) => (
            <li key={lineIndex}>
              {line.replace(/^\d+[.)]\s+/, "")}
            </li>
          ))}
        </ol>
      );
    }

    if (
      lines.length === 1 &&
      lines[0].length <= 80 &&
      !/[.!?]$/.test(lines[0])
    ) {
      return (
        <h2
          key={index}
          className="pt-3 text-2xl font-black text-white"
        >
          {lines[0]}
        </h2>
      );
    }

    return (
      <p
        key={index}
        className="whitespace-pre-line leading-8 text-slate-300"
      >
        {block}
      </p>
    );
  });
}

export default async function AdminGuideSubmissionDetailPage({
  params,
  searchParams,
}: AdminGuideSubmissionDetailPageProps) {
  const { id } = await params;
  const { error } = await searchParams;
  const {
    supabase,
  } = await requireRole(
    MODERATION_ROLES,
    "/",
  );

  const { data, error: submissionError } =
    await supabase
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
      .maybeSingle();

  if (submissionError || !data) {
    notFound();
  }

  const submission =
    data as GuideSubmissionDetail;

  const { data: author } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", submission.user_id)
    .maybeSingle();

  const canModerate =
    submission.status === "pending";

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin/guide-submissions"
          className="text-xs font-black uppercase tracking-[0.16em] text-cyan-400 transition hover:text-white"
        >
          ← Back to guide submissions
        </Link>

        <section className="mt-6 rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-7 md:p-10">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-yellow-400">
            Community guide
          </p>

          <h1 className="mt-4 break-words text-4xl font-black md:text-6xl">
            {submission.title}
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">
            {submission.excerpt}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Badge>{submission.category}</Badge>
            <Badge>
              {submission.difficulty ??
                "Difficulty not set"}
            </Badge>
            <Badge>
              {submission.reading_time !== null
                ? `${submission.reading_time} min read`
                : "Reading time not set"}
            </Badge>
            <Badge>
              {submission.status.replace("_", " ")}
            </Badge>
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
                Submission details
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <InfoCell
                  label="Author"
                  value={
                    author?.display_name ??
                    author?.email ??
                    "Unknown"
                  }
                />
                <InfoCell
                  label="Related game"
                  value={
                    submission.related_game_slug ??
                    "None"
                  }
                />
                <InfoCell
                  label="Related handheld"
                  value={
                    submission.related_handheld_slug ??
                    "None"
                  }
                />
                <InfoCell
                  label="Cover image"
                  value={
                    submission.cover_image_url ??
                    "Not set"
                  }
                />
              </div>
            </article>

            <article className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-400">
                Guide preview
              </p>

              <div className="mt-6 space-y-6">
                {renderGuideContent(
                  submission.content,
                )}
              </div>
            </article>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-yellow-400">
                Moderation
              </p>

              {canModerate ? (
                <form className="mt-5 space-y-4">
                  <input
                    type="hidden"
                    name="submissionId"
                    value={submission.id}
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
                      rows={7}
                      defaultValue={
                        submission.moderator_note ?? ""
                      }
                      placeholder="Explain requested changes or the rejection reason."
                      className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                    />
                  </div>

                  <button
                    formAction={approveGuideSubmission}
                    className="w-full rounded-xl bg-green-500 px-5 py-3 font-black text-slate-950 transition hover:bg-green-400"
                  >
                    Approve & publish
                  </button>

                  <button
                    formAction={requestGuideChanges}
                    className="w-full rounded-xl border border-purple-500/30 bg-purple-500/10 px-5 py-3 font-black text-purple-300 transition hover:bg-purple-500 hover:text-white"
                  >
                    Request changes
                  </button>

                  <button
                    formAction={rejectGuideSubmission}
                    className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 font-black text-red-400 transition hover:bg-red-500 hover:text-white"
                  >
                    Reject guide
                  </button>
                </form>
              ) : (
                <div className="mt-4 rounded-xl border border-slate-800 bg-black/20 p-4">
                  <p className="font-black text-slate-300">
                    Review complete
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    This guide is no longer pending and cannot be moderated again.
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
                  {submission.moderator_note}
                </p>
              </section>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}

function Badge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-full border border-white/[0.1] bg-black/25 px-3 py-1 text-xs font-black capitalize text-slate-300">
      {children}
    </span>
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
