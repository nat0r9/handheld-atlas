import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { logoutAdmin } from "./actions";

const adminSections = [
  {
    title: "Games",
    description: "Create and edit game profiles.",
    href: "/admin/games",
  },
  {
    title: "Handhelds",
    description: "Manage devices and specifications.",
    href: "/admin/handhelds",
  },
  {
    title: "Presets",
    description: "Build detailed performance presets.",
    href: "/admin/presets",
  },
  {
    title: "Benchmarks",
    description: "Add verified performance results.",
    href: "/admin/benchmarks",
  },
  {
    title: "Guides",
    description: "Write practical handheld guides.",
    href: "/admin/guides",
  },
  {
    title: "News",
    description: "Publish news and featured stories.",
    href: "/admin/news",
  },
];

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, email, is_admin")
    .eq("id", user.id)
    .single();

  if (error || !profile?.is_admin) {
    await supabase.auth.signOut();
    redirect("/admin/login");
  }

  const [
    gamesResult,
    handheldsResult,
    presetsResult,
    benchmarksResult,
    guidesResult,
    newsResult,
  ] = await Promise.all([
    supabase
      .from("games")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("handhelds")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("presets")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("benchmarks")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("guides")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("news_posts")
      .select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    {
      label: "Games",
      value: gamesResult.count ?? 0,
    },
    {
      label: "Handhelds",
      value: handheldsResult.count ?? 0,
    },
    {
      label: "Presets",
      value: presetsResult.count ?? 0,
    },
    {
      label: "Benchmarks",
      value: benchmarksResult.count ?? 0,
    },
    {
      label: "Guides",
      value: guidesResult.count ?? 0,
    },
    {
      label: "News",
      value: newsResult.count ?? 0,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-400">
              HandheldAtlas Control Center
            </p>

            <h1 className="mt-3 text-5xl font-black">
              Admin Dashboard
            </h1>

            <p className="mt-4 text-slate-400">
              Signed in as{" "}
              <strong className="text-slate-200">
                {profile.display_name ??
                  profile.email ??
                  user.email}
              </strong>
            </p>
          </div>

          <form action={logoutAdmin}>
            <button
              type="submit"
              className="rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-400 transition hover:bg-red-500 hover:text-white"
            >
              Sign out
            </button>
          </form>
        </div>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                {stat.label}
              </p>

              <p className="mt-3 text-4xl font-black">
                {stat.value}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-12">
          <h2 className="text-3xl font-black">
            Content management
          </h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {adminSections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="group rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:-translate-y-1 hover:border-cyan-500"
              >
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
                  Manage
                </p>

                <h3 className="mt-3 text-2xl font-black transition group-hover:text-cyan-400">
                  {section.title}
                </h3>

                <p className="mt-3 leading-7 text-slate-400">
                  {section.description}
                </p>

                <p className="mt-6 font-bold text-cyan-400">
                  Open section →
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}