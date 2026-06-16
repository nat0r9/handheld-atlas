import {
  getSubmissionEventClassName,
  getSubmissionEventLabel,
  type SubmissionEventType,
} from "../../lib/submission-workflow";

export interface SubmissionTimelineEvent {
  id: string;
  eventType: SubmissionEventType;
  note: string | null;
  revisionNumber: number;
  createdAt: string;
  actorName: string | null;
}

interface SubmissionTimelineProps {
  events: SubmissionTimelineEvent[];
}

function formatDate(value: string) {
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

export default function SubmissionTimeline({
  events,
}: SubmissionTimelineProps) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-black/20 p-5 sm:p-6">
      <p className="atlas-section-label">Review history</p>

      <h2 className="mt-2 text-2xl font-black text-white">
        Submission timeline
      </h2>

      {events.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-white/[0.08] p-5 text-sm leading-6 text-slate-500">
          No workflow events are available yet. The first event appears after the Phase 4 database migration is installed.
        </p>
      ) : (
        <ol className="mt-6 space-y-0">
          {events.map((event, index) => (
            <li
              key={event.id}
              className="relative grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3 pb-6 last:pb-0"
            >
              {index !== events.length - 1 && (
                <span className="absolute left-[0.72rem] top-6 h-[calc(100%-0.25rem)] w-px bg-white/[0.08]" />
              )}

              <span
                className={`relative z-10 mt-1 flex h-6 w-6 items-center justify-center rounded-full border text-[0.55rem] font-black ${getSubmissionEventClassName(
                  event.eventType,
                )}`}
                aria-hidden="true"
              >
                {events.length - index}
              </span>

              <div className="min-w-0 rounded-xl border border-white/[0.07] bg-[#060911] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-200">
                      {getSubmissionEventLabel(event.eventType)}
                    </p>

                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.1em] text-slate-600">
                      Revision {event.revisionNumber}
                      {event.actorName
                        ? ` · ${event.actorName}`
                        : ""}
                    </p>
                  </div>

                  <time className="text-xs text-slate-600">
                    {formatDate(event.createdAt)}
                  </time>
                </div>

                {event.note && (
                  <p className="mt-3 whitespace-pre-line border-t border-white/[0.06] pt-3 text-sm leading-6 text-slate-400">
                    {event.note}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
