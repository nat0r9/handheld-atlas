import Image from "next/image";
import Link from "next/link";
import { handhelds } from "../../data/handhelds";

function getStatusStyle(status: string) {
  switch (status) {
    case "Current":
      return "bg-green-500 text-white";

    case "Upcoming":
      return "bg-orange-500 text-white";

    case "Discontinued":
      return "bg-red-500 text-white";

    default:
      return "bg-slate-600 text-white";
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
            Explore specifications, presets and benchmarks for supported
            handheld gaming devices.
          </p>

          <div className="mt-10 flex items-center justify-between gap-4">
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

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {handhelds.map((handheld) => (
              <Link
                key={handheld.slug}
                href={`/handhelds/${handheld.slug}`}
                className="group"
              >
                <article className="overflow-hidden rounded-[1.75rem] border border-slate-800 bg-slate-950 shadow-xl transition duration-300 hover:-translate-y-1 hover:border-cyan-500">
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                    <Image
                      src={handheld.image}
                      alt={handheld.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                    <div className="absolute right-4 top-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide shadow-lg ${getStatusStyle(
                          handheld.status,
                        )}`}
                      >
                        {handheld.status}
                      </span>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-6">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
                        {handheld.manufacturer}
                      </p>

                      <h2 className="mt-2 text-4xl font-black">
                        {handheld.name}
                      </h2>
                    </div>
                  </div>

                  <div className="p-6">
                    <p className="leading-7 text-slate-400">
                      {handheld.tagline}
                    </p>

                    <div className="mt-6 grid grid-cols-2 gap-4">
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

                    <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-5">
                      <span className="text-sm text-slate-500">
                        {handheld.operatingSystem}
                      </span>

                      <span className="font-bold text-cyan-400">
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