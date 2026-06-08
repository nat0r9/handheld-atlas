import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { loginUser } from "../auth/actions";

interface LoginPageProps {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
}

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const { error, success } =
    await searchParams;

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
        <section className="atlas-panel w-full max-w-lg overflow-hidden">
          <div className="border-b border-white/[0.07] bg-[radial-gradient(circle_at_20%_0%,rgba(239,35,60,0.16),transparent_45%),linear-gradient(135deg,#0b101b,#070910)] p-6 sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 font-black text-red-400">
              HA
            </div>

            <p className="mt-7 atlas-section-label">
              Community access
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              Welcome back.
            </h1>

            <p className="mt-4 max-w-md leading-7 text-slate-400">
              Sign in to submit presets, manage your profile
              and take part in the HandheldAtlas community.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {success && (
              <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">
                {success}
              </div>
            )}

            {error && (
              <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            <form
              action={loginUser}
              className="space-y-5"
            >
              <AuthField
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
              />

              <AuthField
                label="Password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••••"
              />

              <button
                type="submit"
                className="atlas-button-primary w-full"
              >
                Sign in
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              New to the Atlas?{" "}
              <Link
                href="/register"
                className="font-black text-cyan-400 transition hover:text-white"
              >
                Create an account
              </Link>
            </p>

            <div className="mt-6 border-t border-white/[0.07] pt-5 text-center">
              <Link
                href="/"
                className="text-xs font-black uppercase tracking-[0.14em] text-slate-600 transition hover:text-cyan-400"
              >
                ← Return home
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

interface AuthFieldProps {
  label: string;
  name: string;
  type: "email" | "password";
  autoComplete: string;
  placeholder: string;
}

function AuthField({
  label,
  name,
  type,
  autoComplete,
  placeholder,
}: AuthFieldProps) {
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
        className="w-full rounded-xl border border-white/[0.09] bg-black/30 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-500"
      />
    </div>
  );
}
