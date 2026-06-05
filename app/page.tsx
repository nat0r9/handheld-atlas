const navItems = ["Games", "Handhelds", "Presets", "Benchmarks", "Compare", "Guides"];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="fixed left-0 right-0 top-0 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="text-xl font-black tracking-tight">
            HandheldAtlas
          </div>

          <div className="hidden gap-6 text-sm text-slate-400 md:flex">
            {navItems.map((item) => (
              <a key={item} href="#" className="hover:text-white">
                {item}
              </a>
            ))}
          </div>
        </nav>
      </header>

      <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 pt-24">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-cyan-400">
          Handheld Gaming Database
        </p>

        <h1 className="mb-6 text-5xl font-black tracking-tight md:text-7xl">
          HandheldAtlas
        </h1>

        <p className="mb-10 max-w-2xl text-lg text-slate-400 md:text-xl">
          Find the best settings, benchmarks, TDP profiles and battery presets
          for every handheld gaming device.
        </p>

        <div className="max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/80 p-3 shadow-2xl">
          <input
            className="w-full rounded-xl bg-slate-950 px-5 py-4 text-white outline-none placeholder:text-slate-500"
            placeholder="Search Cyberpunk 2077, ROG Ally X, Steam Deck..."
          />
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-500">Trending Game</p>
            <h2 className="mt-2 text-xl font-bold">Cyberpunk 2077</h2>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-500">Popular Handheld</p>
            <h2 className="mt-2 text-xl font-bold">ROG Ally X</h2>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-500">Atlas Score</p>
            <h2 className="mt-2 text-xl font-bold">91 / 100</h2>
          </div>
        </div>
      </section>
    </main>
  );
}