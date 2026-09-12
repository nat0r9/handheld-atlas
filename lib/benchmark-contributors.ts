import { createClient } from "./supabase/server";
import type { PublicContributor } from "./contributors";
import type { BenchmarkRecord } from "./benchmarks";
export async function withBenchmarkContributors(records: BenchmarkRecord[]) {
  const ids = Array.from(
    new Set(
      records
        .filter(
          (b) =>
            b.evidence_tier === "atlas_verified" ||
            b.evidence_tier === "community_verified",
        )
        .map((b) => b.created_by)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  if (!ids.length) return records;
  const db = await createClient();
  const { data, error } = await db
    .from("profiles")
    .select(
      "id,display_name,public_slug,avatar_url,contributor_level,public_profile",
    )
    .in("id", ids);
  if (error) {
    console.error("Could not load benchmark contributors:", error.message);
    return records;
  }
  const profiles = new Map(
    ((data ?? []) as PublicContributor[]).map((p) => [p.id, p]),
  );
  return records.map((b) => ({
    ...b,
    contributor: b.created_by ? (profiles.get(b.created_by) ?? null) : null,
  }));
}
