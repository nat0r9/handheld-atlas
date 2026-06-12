import Link from "next/link";
import {
  BENCHMARK_EDITOR_ROLES,
  getRoleLabel,
} from "../../../lib/auth/roles";
import { requireRole } from "../../../lib/auth/require-role";

export default async function TesterWorkspacePage() {
  const {
    role,
  } = await requireRole(
    BENCHMARK_EDITOR_ROLES,
    "/",
  );

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/profile"
          className="text-sm font-bold text-cyan-400 transition hover:text-cyan-300"
        >
          ← Back to profile
        </Link>

        <section className="mt-8 rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-7 md:p-10">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-400">
            Atlas Workspace
          </p>

          <h1 className="mt-4 text-4xl font-black md:text-6xl">
            Benchmark testing command deck.
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">
            Build draft presets first, then connect them to measured
            benchmark results. No mystical FPS pulled from someone&apos;s
            arse—only tested data.
          </p>

          <p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-purple-300">
            Access: {getRoleLabel(role)}
          </p>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          <WorkspaceCard
            href="/admin/presets"
            eyebrow="Step one"
            title="Preset Workshop"
            description="Create and maintain your own draft settings profiles for specific game and handheld combinations."
            action="Manage presets"
          />

          <WorkspaceCard
            href="/admin/benchmarks"
            eyebrow="Step two"
            title="Benchmark Lab"
            description="Attach a preset and record average FPS, 1% lows, power limits, battery data and test notes."
            action="Manage benchmarks"
          />
        </section>
      </div>
    </main>
  );
}

function WorkspaceCard({
  href,
  eyebrow,
  title,
  description,
  action,
}: {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  action: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:-translate-y-1 hover:border-cyan-500/50"
    >
      <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-400">
        {eyebrow}
      </p>

      <h2 className="mt-3 text-3xl font-black">
        {title}
      </h2>

      <p className="mt-3 leading-7 text-slate-400">
        {description}
      </p>

      <p className="mt-6 text-sm font-black text-cyan-400 transition group-hover:text-white">
        {action} →
      </p>
    </Link>
  );
}
