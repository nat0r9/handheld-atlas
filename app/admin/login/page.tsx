import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { loginAdmin } from "./actions";

interface AdminLoginPageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const { error } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (profile?.is_admin) {
      redirect("/admin");
    }
  }

  return (
    <main className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden bg-slate-950 px-6 py-20 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(6,182,212,0.16),transparent_35%)]" />

      <div className="relative mx-auto w-full max-w-md">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 font-black text-cyan-400">
            HA
          </div>

          <p className="mt-8 text-sm font-bold uppercase tracking-[0.3em] text-cyan-400">
            Restricted Area
          </p>

          <h1 className="mt-3 text-4xl font-black">
            Admin Login
          </h1>

          <p className="mt-3 leading-7 text-slate-400">
            Sign in to manage HandheldAtlas content.
          </p>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          <form action={loginAdmin} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
              >
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                placeholder="admin@handheldatlas.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                placeholder="••••••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-cyan-500 px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-400"
            >
              Enter dashboard
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}