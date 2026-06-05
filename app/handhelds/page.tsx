import { handhelds } from "@/data/handhelds";
export default function HandheldsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <h1 className="mb-2 text-5xl font-black">
          Handhelds
        </h1>

        <p className="mb-10 text-slate-400">
          Browse supported handheld gaming devices.
        </p>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {handhelds.map((handheld) => (
            <div
              key={handheld.name}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
            >
              <p className="text-sm text-slate-500">
                {handheld.manufacturer}
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                {handheld.name}
              </h2>

              <div className="mt-4">
                <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-sm text-cyan-400">
                  {handheld.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}