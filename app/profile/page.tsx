import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import {
  logoutUser,
  updateProfile,
} from "../auth/actions";

interface ProfilePageProps {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
}

interface ProfileRecord {
  email: string | null;
  display_name: string | null;
  is_admin: boolean;
  created_at: string;
}

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

export default async function ProfilePage({
  searchParams,
}: ProfilePageProps) {
  const { error, success } =
    await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(
      "email, display_name, is_admin, created_at",
    )
    .eq("id", user.id)
    .single();

  const profile =
    data as ProfileRecord | null;

  return (
    <main className="atlas-page min-h-[calc(100vh-4rem)] pb-14 text-white">
      <section className="border-b border-white/[0.06]">
        <div className="atlas-shell py-10 sm:py-14">
          <p className="atlas-section-label">
            Community profile
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-6xl">
            Your place in the Atlas.
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
            Manage your public name and account details.
            Your submitted presets will live here once
            community submissions are enabled.
          </p>
        </div>
      </section>

      <div className="atlas-shell pt-6">
        {success && (
          <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">
            {success}
          </div>
        )}

        {(error || profileError) && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error ??
              profileError?.message ??
              "Could not load the profile."}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="atlas-panel p-5 sm:p-7">
            <div className="border-b border-white/[0.07] pb-4">
              <p className="atlas-section-label">
                Account settings
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Edit profile
              </h2>
            </div>

            <form
              action={updateProfile}
              className="mt-6 space-y-5"
            >
              <div>
                <label
                  htmlFor="displayName"
                  className="mb-2 block text-[0.58rem] font-black uppercase tracking-[0.15em] text-slate-600"
                >
                  Display name
                </label>

                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                  minLength={2}
                  maxLength={40}
                  defaultValue={
                    profile?.display_name ??
                    user.user_metadata
                      ?.display_name ??
                    ""
                  }
                  className="w-full rounded-xl border border-white/[0.09] bg-black/30 px-4 py-3.5 text-white outline-none transition focus:border-cyan-500"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-email"
                  className="mb-2 block text-[0.58rem] font-black uppercase tracking-[0.15em] text-slate-600"
                >
                  Email
                </label>

                <input
                  id="profile-email"
                  type="email"
                  readOnly
                  value={
                    profile?.email ??
                    user.email ??
                    ""
                  }
                  className="w-full cursor-not-allowed rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3.5 text-slate-500"
                />
              </div>

              <button
                type="submit"
                className="atlas-button-primary"
              >
                Save profile
              </button>
            </form>
          </section>

          <aside className="space-y-5">
            <section className="atlas-panel p-5">
              <p className="atlas-section-label">
                Account overview
              </p>

              <dl className="mt-4 space-y-4">
                <ProfileRow
                  label="Member since"
                  value={
                    profile
                      ? formatDate(
                          profile.created_at,
                        )
                      : "Unknown"
                  }
                />

                <ProfileRow
                  label="Role"
                  value={
                    profile?.is_admin
                      ? "Administrator"
                      : "Community member"
                  }
                />

                <ProfileRow
                  label="Email status"
                  value={
                    user.email_confirmed_at
                      ? "Confirmed"
                      : "Unconfirmed"
                  }
                />
              </dl>
            </section>

            <section className="atlas-panel p-5">
              <p className="atlas-section-label">
                Community tools
              </p>

              <div className="mt-4 grid gap-3">
                <Link
                  href="/my-submissions"
                  className="atlas-button-secondary w-full text-center"
                >
                  My submissions
                </Link>

                {profile?.is_admin && (
                  <Link
                    href="/admin"
                    className="atlas-button-secondary w-full text-center"
                  >
                    Open admin
                  </Link>
                )}
              </div>
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

function ProfileRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] pb-4 last:border-0 last:pb-0">
      <dt className="text-sm text-slate-600">
        {label}
      </dt>

      <dd className="max-w-[60%] text-right text-sm font-black text-slate-300">
        {value}
      </dd>
    </div>
  );
}
