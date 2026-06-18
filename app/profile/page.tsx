import Link from "next/link";
import { redirect } from "next/navigation";
import {
  contributorLevelClass,
  contributorLevelLabel,
  type ContributorLevel,
} from "../../lib/contributors";
import { createClient } from "../../lib/supabase/server";
import { logoutUser, updateProfile } from "../auth/actions";

interface ProfilePageProps {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
}

interface ProfileRecord {
  email: string | null;
  display_name: string | null;
  role: string | null;
  is_admin: boolean;
  created_at: string;
  public_slug: string | null;
  public_profile: boolean;
  bio: string | null;
  owned_devices: string[] | null;
  contributor_level: ContributorLevel | null;
  contribution_score: number | null;
}

type DashboardAccent = "red" | "cyan" | "green" | "purple";

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function roleLabel(role: string | null, isAdmin: boolean) {
  if (isAdmin || role === "admin") {
    return "Administrator";
  }

  if (role === "atlas_editor") {
    return "Atlas Editor";
  }

  if (role === "moderator") {
    return "Moderator";
  }

  if (role === "benchmark_tester") {
    return "Benchmark Tester";
  }

  return "Community Member";
}

export default async function ProfilePage({
  searchParams,
}: ProfilePageProps) {
  const { error, success } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data, error: profileError }, submissionsResult, guidesResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "email, display_name, role, is_admin, created_at, public_slug, public_profile, bio, owned_devices, contributor_level, contribution_score",
        )
        .eq("id", user.id)
        .single(),
      supabase
        .from("preset_submissions")
        .select("id, status")
        .eq("user_id", user.id),
      supabase
        .from("guide_submissions")
        .select("id, status")
        .eq("user_id", user.id),
    ]);

  const profile = data as ProfileRecord | null;
  const submissions = submissionsResult.data ?? [];
  const guides = guidesResult.data ?? [];

  const needsAction =
    submissions.filter(
      (item) =>
        item.status === "changes_requested" || item.status === "rejected",
    ).length +
    guides.filter(
      (item) =>
        item.status === "changes_requested" || item.status === "rejected",
    ).length;

  const pending =
    submissions.filter((item) => item.status === "pending").length +
    guides.filter((item) => item.status === "pending").length;

  const published =
    submissions.filter((item) => item.status === "approved").length +
    guides.filter((item) => item.status === "approved").length;

  const displayName =
    profile?.display_name ??
    user.user_metadata?.display_name ??
    "Community Member";

  const publicHref =
    profile?.public_profile && profile.public_slug
      ? `/contributors/${profile.public_slug}`
      : null;

  const role = profile?.role ?? null;
  const isAdministrator = Boolean(profile?.is_admin || role === "admin");
  const canAccessAtlasWorkshop =
    isAdministrator || role === "moderator" || role === "atlas_editor";

  return (
    <main className="atlas-page min-h-[calc(100vh-4rem)] pb-14 text-white">
      <section className="border-b border-white/[0.06]">
        <div className="atlas-shell py-10 sm:py-14">
          <p className="atlas-section-label">Contributor hub</p>

          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-[-0.05em] sm:text-6xl">
                Welcome back, {displayName}.
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
                Continue drafts, handle moderator feedback and keep your public
                contributor identity under control.
              </p>
            </div>

            {publicHref && (
              <Link href={publicHref} className="atlas-button-secondary">
                View public profile →
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="atlas-shell space-y-6 pt-6">
        {success && (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">
            {success}
          </div>
        )}

        {(error || profileError) && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error ??
              profileError?.message ??
              "Could not load the profile."}
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            label="Needs action"
            value={needsAction}
            description="Feedback waiting for you"
            href="/my-submissions?status=changes_requested"
            accent="red"
          />

          <DashboardCard
            label="In review"
            value={pending}
            description="Locked in moderation"
            href="/my-submissions?status=pending"
            accent="cyan"
          />

          <DashboardCard
            label="Published"
            value={published}
            description="Live community work"
            href={publicHref ?? "/my-submissions?status=approved"}
            accent="green"
          />

          <DashboardCard
            label="Reputation"
            value={profile?.contribution_score ?? 0}
            description={contributorLevelLabel(profile?.contributor_level)}
            href={publicHref ?? "/profile"}
            accent="purple"
          />
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="atlas-panel p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-4">
              <div>
                <p className="atlas-section-label">Profile settings</p>
                <h2 className="mt-2 text-2xl font-black">
                  Contributor identity
                </h2>
              </div>

              <span
                className={`rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.1em] ${contributorLevelClass(
                  profile?.contributor_level,
                )}`}
              >
                {contributorLevelLabel(profile?.contributor_level)}
              </span>
            </div>

            <form action={updateProfile} className="mt-6 space-y-5">
              <Field label="Display name">
                <input
                  id="displayName"
                  name="displayName"
                  required
                  minLength={2}
                  maxLength={40}
                  defaultValue={displayName}
                  className="atlas-input w-full"
                />
              </Field>

              <Field label="Short bio">
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  maxLength={500}
                  defaultValue={profile?.bio ?? ""}
                  placeholder="What do you test, tune or research?"
                  className="atlas-input w-full resize-y"
                />
              </Field>

              <Field label="Testing devices">
                <input
                  id="ownedDevices"
                  name="ownedDevices"
                  defaultValue={(profile?.owned_devices ?? []).join(", ")}
                  placeholder="ROG Ally X, Steam Deck OLED"
                  className="atlas-input w-full"
                />

                <p className="mt-2 text-xs text-slate-600">
                  Separate devices with commas.
                </p>
              </Field>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.08] bg-black/20 p-4">
                <input
                  type="checkbox"
                  name="publicProfile"
                  defaultChecked={profile?.public_profile ?? true}
                  className="mt-1 h-4 w-4 accent-cyan-500"
                />

                <span>
                  <span className="block font-black">
                    Public contributor profile
                  </span>

                  <span className="mt-1 block text-sm leading-6 text-slate-500">
                    Show your display name, badges and published work. Email is
                    never public.
                  </span>
                </span>
              </label>

              <button type="submit" className="atlas-button-primary">
                Save profile
              </button>
            </form>
          </section>

          <aside className="space-y-5">
            <section className="atlas-panel p-5">
              <p className="atlas-section-label">Quick actions</p>

              <div className="mt-4 grid gap-3">
                <Quick
                  href="/my-submissions/new"
                  title="Create preset"
                  text="Start a tested settings profile."
                />

                <Quick
                  href="/my-guide-submissions/new"
                  title="Write guide"
                  text="Share practical know-how."
                />

                <Quick
                  href="/my-submissions"
                  title="Preset workshop"
                  text="Track drafts and review rounds."
                />

                <Quick
                  href="/my-guide-submissions"
                  title="Guide workshop"
                  text="Manage knowledge submissions."
                />
              </div>
            </section>

            {canAccessAtlasWorkshop && (
              <section className="atlas-panel overflow-hidden">
                <div className="border-b border-red-500/20 bg-gradient-to-r from-red-500/10 via-red-500/[0.04] to-transparent p-5">
                  <p className="atlas-section-label">Staff access</p>
                  <h2 className="mt-2 text-xl font-black">Atlas Workshop</h2>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Open the complete admin dashboard for moderation, content,
                    audits and database management.
                  </p>
                </div>

                <div className="p-4">
                  <Link
                    href="/admin"
                    className="flex items-center justify-between gap-4 rounded-xl border border-red-500/25 bg-red-500/[0.08] p-4 transition hover:border-red-400/50 hover:bg-red-500/[0.14]"
                  >
                    <span>
                      <span className="block text-sm font-black text-white">
                        Enter Atlas Workshop
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">
                        Open the full Atlas control room.
                      </span>
                    </span>

                    <span
                      aria-hidden="true"
                      className="text-lg font-black text-red-400"
                    >
                      →
                    </span>
                  </Link>
                </div>
              </section>
            )}

            <section className="atlas-panel p-5">
              <p className="atlas-section-label">Account</p>

              <dl className="mt-4 space-y-3 text-sm">
                <Row
                  label="Member since"
                  value={profile ? formatDate(profile.created_at) : "Unknown"}
                />

                <Row
                  label="Role"
                  value={roleLabel(role, profile?.is_admin ?? false)}
                />

                <Row
                  label="Email"
                  value={profile?.email ?? user.email ?? "Unknown"}
                />
              </dl>
            </section>

            <form action={logoutUser}>
              <button
                type="submit"
                className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-black text-red-400 transition hover:bg-red-500 hover:text-white"
              >
                Sign out
              </button>
            </form>
          </aside>
        </div>
      </div>
    </main>
  );
}

function DashboardCard({
  label,
  value,
  description,
  href,
  accent,
}: {
  label: string;
  value: number;
  description: string;
  href: string;
  accent: DashboardAccent;
}) {
  const colors: Record<DashboardAccent, string> = {
    red: "hover:border-red-500/40",
    cyan: "hover:border-cyan-500/40",
    green: "hover:border-green-500/40",
    purple: "hover:border-purple-500/40",
  };

  return (
    <Link
      href={href}
      className={`atlas-card atlas-card-hover p-4 ${colors[accent]}`}
    >
      <p className="text-3xl font-black">{value}</p>
      <p className="mt-2 text-sm font-black">{label}</p>
      <p className="mt-1 text-xs text-slate-600">{description}</p>
    </Link>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-[0.58rem] font-black uppercase tracking-[0.15em] text-slate-600">
        {label}
      </label>
      {children}
    </div>
  );
}

function Quick({
  href,
  title,
  text,
}: {
  href: string;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-white/[0.08] bg-black/20 p-4 transition hover:border-cyan-500/40 hover:bg-cyan-500/[0.05]"
    >
      <p className="text-sm font-black">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
    </Link>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-b border-white/[0.06] pb-3 last:border-0">
      <dt className="text-slate-600">{label}</dt>
      <dd className="mt-1 break-all font-black text-slate-300">{value}</dd>
    </div>
  );
}
