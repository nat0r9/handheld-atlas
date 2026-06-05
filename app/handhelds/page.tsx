import Image from "next/image";
import Link from "next/link";
import { handhelds } from "../../data/handhelds";

function getStatusStyle(status: string) {
  switch (status) {
    case "Current":
      return "border-green-400/30 bg-green-500/15 text-green-400";

    case "Upcoming":
      return "border-orange-400/30 bg-orange-500/15 text-orange-400";

    case "Discontinued":
      return "border-red-400/30 bg-red-500/15 text-red-400";

    default:
      return "border-slate-500/30 bg-slate-500/15 text-slate-300";
  }
}

export default function HandheldsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-[2rem] border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl md:p-8">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
            Handheld Gaming Devices
          </p>

          <h1 className="mt-4 text-center text-4xl font-black md:text-5xl">
            Handhelds
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-400">
            Explore handheld gaming devices, specifications, presets and
            verified performance data.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
            <h2 className="rounded-full border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-black uppercase tracking-[0.18em]">
              {handhelds.length} Devices
            </h2>

            <Link
              href="/compare"
              className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-400 transition hover:bg-cyan-500 hover:text-slate-950"
            >
              Compare devices
            </Link>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {handhelds.map((handheld) => (
              <Link
                key={handheld.slug}
                href={`/handhelds/${handheld.slug}`}
                className="group"
              >
                <article className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-800 bg-slate-950 shadow-xl transition duration-300 hover:-translate-y-1 hover:border-cyan-500">
                  <div className="relative flex min-h-72 items-center justify-center overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-5">
                    <div className="absolute left-5 top-5 z-10">
                      <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
                        {handheld.manufacturer}
                      </p>
                    </div>

                    <div className="absolute right-4 top-4 z-10">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide backdrop-blur ${getStatusStyle(
                          handheld.status,
                        )}`}
                      >
                        {handheld.status}
                      </span>
                    </div>

                    <div className="relative mt-8 h-56 w-full">
                      <Image
                        src={handheld.image}
                        alt={handheld.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-contain object-center drop-shadow-[0_25px_35px_rgba(0,0,0,0.7)] transition duration-300 group-hover:scale-110"
                      />
                    </div>

                    <div className="pointer-events-none absolute inset-x-16 bottom-5 h-8 rounded-full bg-cyan-500/10 blur-2xl" />
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="text-3xl font-black transition group-hover:text-cyan-400">
                      {handheld.name}
                    </h2>

                    <p className="mt-3 leading-7 text-slate-400">
                      {handheld.tagline}
                    </p>

                    <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Processor
                        </p>

                        <p className="mt-1 font-bold">
                          {handheld.processor}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Memory
                        </p>

                        <p className="mt-1 font-bold">
                          {handheld.memory}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Display
                        </p>

                        <p className="mt-1 font-bold">
                          {handheld.displaySize}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Battery
                        </p>

                        <p className="mt-1 font-bold">
                          {handheld.battery}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-4 border-t border-slate-800 pt-6">
                      <span className="line-clamp-2 max-w-[65%] text-sm text-slate-500">
                        {handheld.operatingSystem}
                      </span>

                      <span className="shrink-0 font-bold text-cyan-400">
                        View profile →
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}