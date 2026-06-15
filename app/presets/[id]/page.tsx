import Link from "next/link";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import PresetDetailVote from "../../../components/PresetDetailVote";
import { createClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

type PresetType =
  | "Performance"
  | "Balanced"
  | "Battery"
  | "Docked"
  | "Custom";

interface DatabaseSettingItem {
  id: string;
  label: string;
  value: string;
  note: string | null;
  sort_order: number;
}

interface DatabaseSettingGroup {
  id: string;
  name: string;
  sort_order: number;
  preset_setting_items: DatabaseSettingItem[];
}

interface DatabasePreset {
  id: string;
  name: string;
  preset_type: PresetType;
  resolution: string | null;
  tdp: string | null;
  fps_average: number | null;
  one_percent_low: number | null;
  upscaler: string | null;
  battery_life: string | null;
  community_rating: number | null;
  summary: string | null;
  published_at: string | null;
  games: {
    name: string;
    slug: string;
  } | null;
  handhelds: {
    name: string;
    slug: string;
    manufacturer: string;
  } | null;
  preset_setting_groups: DatabaseSettingGroup[];
  preset_votes: Array<{
    user_id: string;
  }>;
}

interface PresetPageProps {
  params: Promise<{
    id: string;
  }>;
}

function getPresetStyle(type: PresetType) {
  switch (type) {
    case "Performance":
      return "border-red-500/30 bg-red-500/10 text-red-400";
    case "Balanced":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-400";
    case "Battery":
      return "border-green-500/30 bg-green-500/10 text-green-400";
    case "Docked":
      return "border-blue-500/30 bg-blue-500/10 text-blue-400";
    default:
      return "border-purple-500/30 bg-purple-500/10 text-purple-400";
  }
}

function formatDate(value: string | null) {
  if (!value) {
    return "Recently published";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently published";
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function renderTextWithLinks(text: string) {
  const parts = text.split(/((?:https?:\/\/|www\.)[^\s]+)/gi);

  return parts.map((part, index) => {
    const isUrl = /^(?:https?:\/\/|www\.)/i.test(part);

    if (!isUrl) {
      return <Fragment key={index}>{part}</Fragment>;
    }

    const trailingMatch = part.match(/^(.*?)([),.;!?]*)$/);
    const cleanUrl = trailingMatch?.[1] ?? part;
    const trailingText = trailingMatch?.[2] ?? "";
    const href = cleanUrl.startsWith("www.")
      ? `https://${cleanUrl}`
      : cleanUrl;

    return (
      <Fragment key={index}>
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="break-all font-bold text-cyan-400 underline decoration-cyan-500/35 underline-offset-4 transition hover:text-white hover:decoration-cyan-300"
        >
          {cleanUrl}
        </a>
        {trailingText}
      </Fragment>
    );
  });
}

export default async function PresetDetailPage({
  params,
}: PresetPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("presets")
    .select(`
      id,
      name,
      preset_type,
      resolution,
      tdp,
      fps_average,
      one_percent_low,
      upscaler,
      battery_life,
      community_rating,
      summary,
      published_at,
      games (
        name,
        slug
      ),
      handhelds (
        name,
        slug,
        manufacturer
      ),
      preset_setting_groups (
        id,
        name,
        sort_order,
        preset_setting_items (
          id,
          label,
          value,
          note,
          sort_order
        )
      ),
      preset_votes (
        user_id
      )
    `)
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const preset = data as unknown as DatabasePreset;

  const groups = [...(preset.preset_setting_groups ?? [])]
    .sort((first, second) => first.sort_order - second.sort_order)
    .map((group) => ({
      id: group.id,
      name: group.name,
      items: [...(group.preset_setting_items ?? [])].sort(
        (first, second) => first.sort_order - second.sort_order,
      ),
    }));

  const settingsCount = groups.reduce(
    (total, group) => total + group.items.length,
    0,
  );

  const upvoteCount = preset.preset_votes?.length ?? 0;
  const hasUpvoted =
    user !== null &&
    (preset.preset_votes ?? []).some((vote) => vote.user_id === user.id);

  const summaryText =
    preset.summary ?? "Tested handheld performance configuration.";

  return (
    <main className="atlas-page min-w-0 overflow-x-hidden pb-16 text-white">
      <section className="border-b border-white/[0.06]">
        <div className="atlas-shell py-7 sm:py-10">
          <Link
            href="/presets"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500 transition hover:text-white"
          >
            <span aria-hidden="true">←</span>
            Back to preset library
          </Link>

          <div className="mt-6 grid min-w-0 gap-7 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-1 text-[0.56rem] font-black uppercase tracking-[0.1em] ${getPresetStyle(
                    preset.preset_type,
                  )}`}
                >
                  {preset.preset_type}
                </span>

                <span className="text-[0.62rem] font-black uppercase tracking-[0.12em] text-cyan-400">
                  {preset.games?.name ?? "Unknown game"}
                </span>

                <span className="text-[0.62rem] text-slate-600">
                  {formatDate(preset.published_at)}
                </span>
              </div>

              <h1 className="mt-4 max-w-5xl break-words text-4xl font-black leading-[0.98] tracking-[-0.045em] sm:text-6xl">
                {preset.name}
              </h1>

              <p className="mt-3 text-base font-bold text-slate-400 sm:text-lg">
                {preset.handhelds?.manufacturer ?? "Unknown manufacturer"}
                {" · "}
                {preset.handhelds?.name ?? "Unknown handheld"}
              </p>

              <div className="mt-6 max-w-5xl rounded-2xl border border-white/[0.07] bg-black/20 p-5 sm:p-6">
                <p className="whitespace-pre-line break-words [overflow-wrap:anywhere] text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
                  {renderTextWithLinks(summaryText)}
                </p>
              </div>
            </div>

            <aside className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {preset.community_rating !== null && (
                <div className="rounded-xl border border-yellow-500/25 bg-yellow-500/[0.07] p-4 text-center">
                  <p className="text-[0.54rem] font-black uppercase tracking-[0.14em] text-yellow-500">
                    Community rating
                  </p>
                  <p className="mt-2 text-3xl font-black text-yellow-300">
                    ★ {preset.community_rating.toFixed(1)}
                  </p>
                </div>
              )}

              <PresetDetailVote
                presetId={preset.id}
                initialCount={upvoteCount}
                initialHasUpvoted={hasUpvoted}
              />

              <div className="grid grid-cols-2 gap-2 sm:col-span-2 lg:col-span-1">
                {preset.games && (
                  <Link
                    href={`/games/${preset.games.slug}`}
                    className="atlas-button-secondary text-center"
                  >
                    Open game
                  </Link>
                )}

                {preset.handhelds && (
                  <Link
                    href={`/handhelds/${preset.handhelds.slug}`}
                    className="atlas-button-secondary text-center"
                  >
                    Open handheld
                  </Link>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <div className="atlas-shell min-w-0 pt-5 sm:pt-6">
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <PresetStat
            label="Resolution"
            value={preset.resolution ?? "Not set"}
          />
          <PresetStat label="TDP" value={preset.tdp ?? "Not set"} />
          <PresetStat
            label="Average FPS"
            value={
              preset.fps_average !== null
                ? `${preset.fps_average} FPS`
                : "Not set"
            }
            highlighted
          />
          <PresetStat
            label="1% Low"
            value={
              preset.one_percent_low !== null
                ? `${preset.one_percent_low} FPS`
                : "Not set"
            }
          />
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetaPanel
            label="Upscaler"
            value={preset.upscaler ?? "Not set"}
          />
          <MetaPanel
            label="Battery"
            value={preset.battery_life ?? "Not set"}
          />
          <MetaPanel
            label="Manufacturer"
            value={preset.handhelds?.manufacturer ?? "Unknown"}
          />
          <MetaPanel
            label="Detailed settings"
            value={`${settingsCount} values`}
          />
        </section>

        <section className="mt-8 min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.07] pb-4">
            <div>
              <p className="atlas-section-label">Complete configuration</p>
              <h2 className="mt-2 text-3xl font-black">Full settings</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Open each group when you need it. The first group starts open,
                so the useful stuff is waiting instead of hiding behind a tiny
                corporate maze.
              </p>
            </div>

            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-600">
              {groups.length} {groups.length === 1 ? "group" : "groups"}
              {" · "}
              {settingsCount} settings
            </p>
          </div>

          {groups.length === 0 ? (
            <div className="atlas-panel mt-5 border-dashed p-10 text-center text-sm text-slate-500">
              No detailed settings are available for this preset yet.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {groups.map((group, groupIndex) => (
                <details
                  key={group.id}
                  open={groupIndex === 0}
                  className="group min-w-0 overflow-hidden rounded-xl border border-white/[0.08] bg-black/20 open:border-cyan-500/25 open:bg-cyan-500/[0.025]"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 transition hover:bg-white/[0.025] sm:px-5">
                    <div className="min-w-0">
                      <h3 className="break-words text-base font-black text-white sm:text-lg">
                        {group.name}
                      </h3>
                      <p className="mt-1 text-[0.56rem] font-black uppercase tracking-[0.12em] text-slate-600">
                        {group.items.length}{" "}
                        {group.items.length === 1 ? "setting" : "settings"}
                      </p>
                    </div>

                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/[0.08] bg-black/30 text-lg font-black text-cyan-400 transition group-open:rotate-45">
                      +
                    </span>
                  </summary>

                  <dl className="border-t border-white/[0.07]">
                    {group.items.map((item, itemIndex) => (
                      <div
                        key={item.id}
                        className={`grid min-w-0 gap-2 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(8rem,38%)] sm:gap-6 sm:px-5 ${
                          itemIndex === group.items.length - 1
                            ? ""
                            : "border-b border-white/[0.06]"
                        }`}
                      >
                        <div className="min-w-0">
                          <dt className="break-words [overflow-wrap:anywhere] text-sm font-bold text-slate-300">
                            {item.label}
                          </dt>

                          {item.note && (
                            <p className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-xs leading-5 text-slate-600">
                              {renderTextWithLinks(item.note)}
                            </p>
                          )}
                        </div>

                        <dd className="min-w-0 whitespace-pre-line break-words [overflow-wrap:anywhere] text-left text-sm font-black leading-5 text-cyan-400 sm:text-right">
                          {renderTextWithLinks(item.value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </details>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function PresetStat({
  label,
  value,
  highlighted = false,
}: {
  label: string;
  value: string;
  highlighted?: boolean;
}) {
  return (
    <article
      className={`min-w-0 rounded-xl border p-4 sm:p-5 ${
        highlighted
          ? "border-red-500/30 bg-red-500/[0.08]"
          : "border-white/[0.08] bg-black/20"
      }`}
    >
      <p className="text-[0.5rem] font-black uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>
      <p
        className={`mt-2 break-words text-base font-black sm:text-xl ${
          highlighted ? "text-red-400" : "text-white"
        }`}
      >
        {value}
      </p>
    </article>
  );
}

function MetaPanel({ label, value }: { label: string; value: string }) {
  return (
    <article className="min-w-0 rounded-xl border border-white/[0.07] bg-black/15 p-4">
      <p className="text-[0.5rem] font-black uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-black text-slate-300">
        {value}
      </p>
    </article>
  );
}
