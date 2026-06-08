import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { registerUser } from "../auth/actions";

interface RegisterPageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const { error } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/profile");
  }

  return (
    <main className="atlas-page min-h-[calc(100vh-4rem)] text-white">
      <div className="atlas-shell flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
        <section className="atlas-panel w-full max-w-xl overflow-hidden">
          <div className="border-b border-white/[0.07] bg-[radial-gradient(circle_at_80%_0%,rgba(24,215,255,0.14),transparent_45%),linear-gradient(135deg,#0b101b,#070910)] p-6 sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 font-black text-cyan-400">
              HA
            </div>

            <p className="mt-7 atlas-section-label">
              Join the community
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              Create your Atlas account.
            </h1>

            <p className="mt-4 max-w-lg leading-7 text-slate-400">
              Build presets, submit real performance data
              and help other handheld players avoid settings roulette.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            <form
              action={registerUser}
              className="space-y-5"
            >
              <RegisterField
                label="Display name"
                name="displayName"
                type="text"
                autoComplete="nickname"
                placeholder="AtlasRider"
                minLength={2}
                maxLength={40}
              />

              <RegisterField
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <RegisterField
                  label="Password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Minimum 8 characters"
                  minLength={8}
                />

                <RegisterField
                  label="Confirm password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  minLength={8}
                />
              </div>

              <button
                type="submit"
                className="atlas-button-primary w-full"
              >
                Create account
              </button>
            </form>

            <p className="mt-5 text-xs leading-6 text-slate-600">
              By creating an account, you agree to use the
              community tools responsibly. Presets submitted
              publicly will require moderation before publication.
            </p>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already registered?{" "}
              <Link
                href="/login"
                className="font-black text-cyan-400 transition hover:text-white"
              >
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

interface RegisterFieldProps {
  label: string;
  name: string;
  type: "text" | "email" | "password";
  autoComplete: string;
  placeholder: string;
  minLength?: number;
  maxLength?: number;
}

function RegisterField({
  label,
  name,
  type,
  autoComplete,
  placeholder,
  minLength,
  maxLength,
}: RegisterFieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-[0.58rem] font-black uppercase tracking-[0.15em] text-slate-600"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        minLength={minLength}
        maxLength={maxLength}
        className="w-full rounded-xl border border-white/[0.09] bg-black/30 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-500"
      />
    </div>
  );
}
