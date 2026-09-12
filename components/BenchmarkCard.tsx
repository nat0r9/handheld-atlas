import ContributorAttribution from "./ContributorAttribution";
import Link from "next/link";
import {
  dateLabel,
  evidenceLabel,
  settingsSummary,
  type BenchmarkRecord,
} from "../lib/benchmarks";

export default function BenchmarkCard({
  benchmark: b,
  expanded = false,
}: {
  benchmark: BenchmarkRecord;
  expanded?: boolean;
}) {
  const settings = settingsSummary(b.test_notes);
  return (
    <article className="atlas-card min-w-0 p-4 sm:p-5" id={`benchmark-${b.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-cyan-300">
            {b.games ? (
              <Link href={`/games/${b.games.slug}`}>{b.games.name}</Link>
            ) : (
              "Game not reported"
            )}
          </p>
          <h3 className="mt-1 text-xl font-black">
            {b.handhelds ? (
              <Link href={`/handhelds/${b.handhelds.slug}`}>
                {b.handhelds.name}
              </Link>
            ) : (
              "Device not reported"
            )}
          </h3>
          <p className="mt-2 text-sm text-slate-300">
            {evidenceLabel(b.evidence_tier)}
            {b.source_name ? ` · ${b.source_name}` : ""}
          </p>
        </div>
        <div className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-right">
          <p className="text-xs text-cyan-200">
            {b.evidence_tier === "estimated" ? "Estimated FPS" : "Average FPS"}
          </p>
          <p className="mt-1 text-3xl font-black text-cyan-300">
            {b.average_fps ?? "—"}
          </p>
        </div>
      </div>
      {b.contributor && (
        <div className="mt-3">
          <ContributorAttribution
            profile={b.contributor}
            label="Tested by"
            compact
          />
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <span className="rounded-lg bg-white/5 px-3 py-2">
          {b.resolution ?? "Resolution not reported"}
        </span>
        <span className="rounded-lg bg-white/5 px-3 py-2 break-words">
          {b.tdp ?? "Power profile not reported"}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-200">
        {settings ??
          b.presets?.name ??
          "See the test notes for reported graphics settings."}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-400">
        {b.tested_at
          ? `Tested ${dateLabel(b.tested_at)}`
          : "Test date not reported"}{" "}
        · Added to Atlas {dateLabel(b.published_at)}
      </p>
      <details open={expanded} className="mt-4 border-t border-white/10 pt-3">
        <summary className="cursor-pointer py-2 text-sm font-bold text-cyan-300 focus-visible:outline-2 focus-visible:outline-cyan-300">
          Settings, measurements & evidence <span aria-hidden="true">↓</span>
        </summary>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <Metric
            label="1% low (source metric)"
            value={
              b.one_percent_low === null ? null : `${b.one_percent_low} FPS`
            }
          />
          <Metric
            label="0.1% low (source metric)"
            value={
              b.point_one_percent_low === null
                ? null
                : `${b.point_one_percent_low} FPS`
            }
          />
          <Metric label="Battery life" value={b.battery_life} />
          <Metric label="Capture tool" value={b.capture_tool} />
          <Metric
            label="Capture duration"
            value={
              b.capture_duration_seconds === null
                ? null
                : `${b.capture_duration_seconds} seconds`
            }
          />
          <Metric label="Runs" value={b.run_count?.toString() ?? null} />
        </dl>
        {b.test_route && (
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Test route: {b.test_route}
          </p>
        )}
        <p className="mt-4 whitespace-pre-line break-words text-sm leading-7 text-slate-300">
          {b.test_notes ?? "No additional test notes were reported."}
        </p>
        {b.source_checked_at && (
          <p className="mt-3 text-xs leading-5 text-slate-400">
            Source checked {dateLabel(b.source_checked_at)}. Checking a source
            is not a new performance test.
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          {b.source_url && /^https?:\/\//i.test(b.source_url) && (
            <a
              href={b.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="atlas-button-secondary"
            >
              View source evidence ↗
            </a>
          )}
          {b.presets && (
            <Link
              href={`/presets/${b.presets.id}`}
              className="atlas-button-secondary"
            >
              Open linked preset
            </Link>
          )}
        </div>
      </details>
      {!expanded && (
        <Link
          href={`/benchmarks/${b.id}`}
          className="mt-3 inline-block py-2 text-sm font-bold text-slate-300 hover:text-cyan-300"
        >
          Open benchmark / share link →
        </Link>
      )}
    </article>
  );
}
function Metric({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="mt-1 font-bold">{value ?? "Not reported"}</dd>
    </div>
  );
}
