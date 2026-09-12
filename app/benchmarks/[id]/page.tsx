import { withBenchmarkContributors } from "../../../lib/benchmark-contributors";
import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import BenchmarkCard from "../../../components/BenchmarkCard";
import {
  BENCHMARK_SELECT,
  type BenchmarkRecord,
} from "../../../lib/benchmarks";
import { assertRead } from "../../../lib/catalog/read";
import { catalogUrl } from "../../../lib/catalog/query";
import { createClient } from "../../../lib/supabase/server";
const getBenchmark = cache(async (id: string) => {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    return null;
  const db = await createClient();
  const { data, error } = await db
    .from("benchmarks")
    .select(BENCHMARK_SELECT)
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  assertRead(error, "benchmark");
  return data
    ? (await withBenchmarkContributors([data as unknown as BenchmarkRecord]))[0]
    : null;
});
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const b = await getBenchmark((await params).id);
  return {
    title: b
      ? `${b.games?.name} — ${b.handhelds?.name} benchmark`
      : "Benchmark not found",
    alternates: { canonical: b ? `/benchmarks/${b.id}` : "/benchmarks" },
  };
}
export default async function BenchmarkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const b = await getBenchmark((await params).id);
  if (!b) notFound();
  return (
    <main className="atlas-page py-8">
      <div className="atlas-shell max-w-4xl">
        <Link
          className="text-sm font-bold text-cyan-300"
          href={catalogUrl("/benchmarks", {
            game: b.games?.slug,
            handheld: b.handhelds?.slug,
          })}
        >
          ← More results for this game and device
        </Link>
        <h1 className="my-6 text-3xl sm:text-4xl">{b.games?.name} benchmark</h1>
        <BenchmarkCard benchmark={b} expanded />
      </div>
    </main>
  );
}
