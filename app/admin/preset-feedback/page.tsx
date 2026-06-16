import Link from "next/link";
import {
  MODERATION_ROLES,
  getRoleLabel,
} from "../../../lib/auth/roles";
import { requireRole } from "../../../lib/auth/require-role";
import {
  removePresetConfirmation,
} from "./actions";

interface PresetFeedbackPageProps {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
}

interface ConfirmationRow {
  id: string;
  preset_id: string;
  user_id: string;
  created_at: string;
  presets: {
    id: string;
    name: string;
    games: {
      name: string;
    } | null;
    handhelds: {
      name: string;
    } | null;
  } | null;
}

interface ModerationLogRow {
  id: string;
  preset_id: string;
  confirmed_user_id: string;
  removed_by: string;
  reason: string;
  removed_at: string;
  presets: {
    id: string;
    name: string;
    games: {
      name: string;
    } | null;
    handhelds: {
      name: string;
    } | null;
  } | null;
}

interface ProfileRow {
  id: string;
  display_name: string | null;
  email: string | null;
  role: string | null;
}

function formatDate(
  value: string,
) {
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

function getProfileLabel(
  profile: ProfileRow | undefined,
  fallbackId: string,
) {
  return (
    profile?.display_name?.trim() ||
    profile?.email?.trim() ||
    `User ${fallbackId.slice(0, 8)}`
  );
}

export default async function PresetFeedbackPage({
  searchParams,
}: PresetFeedbackPageProps) {
  const { error, success } =
    await searchParams;

  const {
    supabase,
    role,
  } = await requireRole(
    MODERATION_ROLES,
    "/",
  );

  const [
    confirmationsResult,
    logResult,
  ] = await Promise.all([
    supabase
      .from("preset_confirmations")
      .select(`
        id,
        preset_id,
        user_id,
        created_at,
        presets (
          id,
          name,
          games (name),
          handhelds (name)
        )
      `)
      .order("created_at", {
        ascending: false,
      })
      .limit(200),

    supabase
      .from(
        "preset_confirmation_moderation_log",
      )
      .select(`
        id,
        preset_id,
        confirmed_user_id,
        removed_by,
        reason,
        removed_at,
        presets (
          id,
          name,
          games (name),
          handhelds (name)
        )
      `)
      .order("removed_at", {
        ascending: false,
      })
      .limit(100),
  ]);

  const confirmations =
    (confirmationsResult.data ??
      []) as unknown as ConfirmationRow[];

  const moderationLog =
    (logResult.data ??
      []) as unknown as ModerationLogRow[];

  const profileIds = Array.from(
    new Set([
      ...confirmations.map(
        (item) => item.user_id,
      ),
      ...moderationLog.flatMap(
        (item) => [
          item.confirmed_user_id,
          item.removed_by,
        ],
      ),
    ]),
  );

  let profiles: ProfileRow[] = [];
  let profileError: string | null = null;

  if (profileIds.length > 0) {
    const result = await supabase
      .from("profiles")
      .select(
        "id, display_name, email, role",
      )
      .in("id", profileIds);

    profiles =
      (result.data ?? []) as ProfileRow[];
    profileError =
      result.error?.message ?? null;
  }

  const profileMap = new Map(
    profiles.map((profile) => [
      profile.id,
      profile,
    ]),
  );

  const uniquePresets = new Set(
    confirmations.map(
      (item) => item.preset_id,
    ),
  ).size;

  const databaseError =
    confirmationsResult.error?.message ??
    logResult.error?.message ??
    profileError;

  return (
    <main className="atlas-page min-h-screen pb-16 text-white">
      <div className="atlas-shell pt-8 sm:pt-10">
        <Link
          href="/admin"
          className="text-sm font-black text-cyan-400 transition hover:text-white"
        >
          ← Back to Atlas Workspace
        </Link>

        <section className="mt-6 rounded-[1.75rem] border border-white/[0.08] bg-black/25 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="atlas-section-label">
                Trust moderation
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-5xl">
                Preset confirmations
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
                Audit the stronger “Worked for me” signal. Remove only clear
                abuse, accidental confirmations or entries that do not match the
                published handheld, TDP and resolution.
              </p>
            </div>

            <span className="rounded-full border border-purple-500/25 bg-purple-500/[0.08] px-3 py-1 text-[0.58rem] font-black uppercase tracking-[0.12em] text-purple-300">
              {getRoleLabel(role)}
            </span>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryMetric
              label="Live confirmations"
              value={confirmations.length}
            />
            <SummaryMetric
              label="Covered presets"
              value={uniquePresets}
            />
            <SummaryMetric
              label="Removed entries"
              value={moderationLog.length}
            />
            <SummaryMetric
              label="Audit status"
              value="Logged"
            />
          </div>
        </section>

        {success && (
          <div className="mt-5 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">
            {success}
          </div>
        )}

        {(error || databaseError) && (
          <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error ?? databaseError}
          </div>
        )}

        <section className="mt-6">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/[0.07] pb-4">
            <div>
              <p className="atlas-section-label">
                Live community proof
              </p>
              <h2 className="mt-2 text-2xl font-black">
                Recent confirmations
              </h2>
            </div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-600">
              Showing up to 200
            </p>
          </div>

          {confirmations.length === 0 ? (
            <div className="atlas-panel mt-5 p-8 text-center text-sm text-slate-500">
              No preset confirmations exist yet.
            </div>
          ) : (
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {confirmations.map(
                (confirmation) => {
                  const profile =
                    profileMap.get(
                      confirmation.user_id,
                    );
                  const preset =
                    confirmation.presets;

                  return (
                    <article
                      key={confirmation.id}
                      className="atlas-panel min-w-0 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[0.55rem] font-black uppercase tracking-[0.13em] text-green-400">
                            Worked for me
                          </p>
                          <h3 className="mt-2 break-words text-lg font-black">
                            {preset?.name ??
                              "Unknown preset"}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {preset?.games?.name ??
                              "Unknown game"}
                            {" · "}
                            {preset?.handhelds?.name ??
                              "Unknown handheld"}
                          </p>
                        </div>

                        {preset?.id && (
                          <Link
                            href={`/presets/${preset.id}`}
                            target="_blank"
                            className="text-xs font-black text-cyan-400 transition hover:text-white"
                          >
                            Open preset ↗
                          </Link>
                        )}
                      </div>

                      <div className="mt-4 grid gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-4 sm:grid-cols-2">
                        <div>
                          <p className="text-[0.5rem] font-black uppercase tracking-[0.12em] text-slate-600">
                            Community member
                          </p>
                          <p className="mt-1 break-words text-sm font-bold text-slate-300">
                            {getProfileLabel(
                              profile,
                              confirmation.user_id,
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-[0.5rem] font-black uppercase tracking-[0.12em] text-slate-600">
                            Confirmed at
                          </p>
                          <p className="mt-1 text-sm font-bold text-slate-300">
                            {formatDate(
                              confirmation.created_at,
                            )}
                          </p>
                        </div>
                      </div>

                      <form
                        action={removePresetConfirmation}
                        className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
                      >
                        <input
                          type="hidden"
                          name="confirmationId"
                          value={confirmation.id}
                        />
                        <select
                          name="reason"
                          required
                          defaultValue=""
                          className="min-w-0 rounded-xl border border-white/[0.09] bg-black/30 px-4 py-3 text-sm text-slate-300 outline-none transition focus:border-red-500"
                        >
                          <option value="" disabled>
                            Choose removal reason
                          </option>
                          <option value="Accidental confirmation reported by the member">
                            Accidental confirmation
                          </option>
                          <option value="Confirmation does not match the published device, TDP or resolution">
                            Target mismatch
                          </option>
                          <option value="Duplicate or abusive community signal">
                            Duplicate or abuse
                          </option>
                          <option value="Preset data changed and the old confirmation is no longer valid">
                            Preset changed
                          </option>
                        </select>
                        <button
                          type="submit"
                          className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm font-black text-red-300 transition hover:bg-red-500 hover:text-white"
                        >
                          Remove + log
                        </button>
                      </form>
                    </article>
                  );
                },
              )}
            </div>
          )}
        </section>

        <section className="mt-10">
          <div className="border-b border-white/[0.07] pb-4">
            <p className="atlas-section-label">
              Audit trail
            </p>
            <h2 className="mt-2 text-2xl font-black">
              Recent moderation actions
            </h2>
          </div>

          {moderationLog.length === 0 ? (
            <div className="atlas-panel mt-5 p-8 text-center text-sm text-slate-500">
              No confirmations have been removed.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {moderationLog.map((item) => {
                const memberProfile =
                  profileMap.get(
                    item.confirmed_user_id,
                  );
                const moderatorProfile =
                  profileMap.get(
                    item.removed_by,
                  );

                return (
                  <article
                    key={item.id}
                    className="atlas-panel grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(12rem,0.45fr)]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-black text-white">
                        {item.presets?.name ??
                          "Unknown preset"}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Removed confirmation from{" "}
                        {getProfileLabel(
                          memberProfile,
                          item.confirmed_user_id,
                        )}
                        : {item.reason}
                      </p>
                    </div>
                    <div className="text-xs leading-5 text-slate-600 lg:text-right">
                      <p>
                        By{" "}
                        <strong className="text-slate-400">
                          {getProfileLabel(
                            moderatorProfile,
                            item.removed_by,
                          )}
                        </strong>
                      </p>
                      <p>
                        {formatDate(item.removed_at)}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-black/20 p-4">
      <p className="text-[0.5rem] font-black uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-white">
        {value}
      </p>
    </div>
  );
}
