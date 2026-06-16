import type { SubmissionReadiness } from "../../lib/submission-workflow";

interface SubmissionReadinessPanelProps {
  readiness: SubmissionReadiness;
  compact?: boolean;
}

export default function SubmissionReadinessPanel({
  readiness,
  compact = false,
}: SubmissionReadinessPanelProps) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-black/20 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[0.58rem] font-black uppercase tracking-[0.14em] text-cyan-400">
            Submission readiness
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            {readiness.isReady
              ? "Ready for moderation"
              : "Finish the evidence"}
          </h2>

          {!compact && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Drafts can stay incomplete. Moderation unlocks only when the preset clearly identifies its test target, measured result and detailed settings.
            </p>
          )}
        </div>

        <div className="min-w-24 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.06] px-4 py-3 text-center">
          <p className="text-2xl font-black text-cyan-300">
            {readiness.score}%
          </p>

          <p className="mt-1 text-[0.5rem] font-black uppercase tracking-[0.12em] text-slate-600">
            complete
          </p>
        </div>
      </div>

      <div className={`mt-5 grid gap-3 ${compact ? "" : "md:grid-cols-2"}`}>
        {readiness.checks.map((check) => (
          <div
            key={check.id}
            className={`rounded-xl border p-4 ${
              check.complete
                ? "border-green-500/20 bg-green-500/[0.06]"
                : "border-white/[0.07] bg-[#060911]"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-black ${
                  check.complete
                    ? "border-green-500/40 bg-green-500/15 text-green-300"
                    : "border-slate-700 bg-black/30 text-slate-600"
                }`}
                aria-hidden="true"
              >
                {check.complete ? "✓" : "·"}
              </span>

              <div>
                <p className="text-sm font-black text-slate-200">
                  {check.label}
                </p>

                {!compact && (
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {check.detail}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-[0.58rem] font-black uppercase tracking-[0.1em] text-slate-600">
        <span className="rounded-full border border-white/[0.07] bg-black/20 px-3 py-1.5">
          {readiness.completeGroups} complete groups
        </span>
        <span className="rounded-full border border-white/[0.07] bg-black/20 px-3 py-1.5">
          {readiness.completeSettings} complete settings
        </span>
      </div>
    </section>
  );
}
