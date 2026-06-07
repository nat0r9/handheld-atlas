export default function Loading() {
  return (
    <main className="min-h-[calc(100vh-4.5rem)] bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-8 md:p-12">
          <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative">
            <div className="h-4 w-52 animate-pulse rounded-full bg-cyan-500/30" />

            <div className="mt-6 h-14 max-w-2xl animate-pulse rounded-2xl bg-slate-800 md:h-20" />

            <div className="mt-5 h-5 max-w-3xl animate-pulse rounded-full bg-slate-800" />

            <div className="mt-3 h-5 max-w-xl animate-pulse rounded-full bg-slate-800" />

            <div className="mt-9 flex flex-wrap gap-3">
              <div className="h-12 w-40 animate-pulse rounded-xl bg-cyan-500/20" />

              <div className="h-12 w-44 animate-pulse rounded-xl bg-slate-800" />
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <article
              key={index}
              className="rounded-3xl border border-slate-800 bg-slate-900 p-6"
            >
              <div className="h-3 w-28 animate-pulse rounded-full bg-slate-700" />

              <div className="mt-5 h-10 w-20 animate-pulse rounded-xl bg-slate-800" />

              <div className="mt-5 h-4 w-full animate-pulse rounded-full bg-slate-800" />

              <div className="mt-3 h-4 w-2/3 animate-pulse rounded-full bg-slate-800" />
            </article>
          ))}
        </section>

        <section className="mt-14">
          <div className="h-4 w-40 animate-pulse rounded-full bg-cyan-500/20" />

          <div className="mt-4 h-10 w-64 animate-pulse rounded-xl bg-slate-800" />

          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <article
                key={index}
                className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900"
              >
                <div className="aspect-[16/10] animate-pulse bg-slate-800" />

                <div className="p-6">
                  <div className="h-4 w-24 animate-pulse rounded-full bg-cyan-500/20" />

                  <div className="mt-5 h-7 w-full animate-pulse rounded-lg bg-slate-800" />

                  <div className="mt-3 h-7 w-3/4 animate-pulse rounded-lg bg-slate-800" />

                  <div className="mt-6 h-4 w-full animate-pulse rounded-full bg-slate-800" />

                  <div className="mt-3 h-4 w-2/3 animate-pulse rounded-full bg-slate-800" />
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-12 flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-[0.2em] text-slate-500">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-400" />
          Loading Atlas data
        </div>
      </div>
    </main>
  );
}