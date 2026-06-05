import { handhelds } from "../../../data/handhelds";

export default async function HandheldPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const handheld = handhelds.find((h) => h.slug === slug);

  if (!handheld) {
    return <div>Handheld not found</div>;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <h1 className="text-5xl font-black">
          {handheld.name}
        </h1>

        <p className="mt-4 text-slate-400">
          Manufacturer: {handheld.manufacturer}
        </p>

        <div className="mt-8">
          <span className="rounded-full bg-cyan-500/20 px-4 py-2 text-cyan-400">
            {handheld.status}
          </span>
        </div>
      </div>
    </main>
  );
}