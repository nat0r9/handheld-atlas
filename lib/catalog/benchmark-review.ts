type Reviewable = {
  id: string;
  status: string;
  handheld_id: string;
  resolution: string | null;
  tdp: string | null;
  average_fps: number | null;
  test_notes: string | null;
  source_url: string | null;
  evidence_tier: string | null;
  games: { name: string } | null;
  handhelds: { name: string } | null;
};
export function benchmarkReviewIssues(row: Reviewable): string[] {
  const issues: string[] = [];
  if (!row.games || !row.handhelds || !row.resolution?.trim() || !row.tdp?.trim() || row.average_fps === null || !row.test_notes?.trim()) issues.push("Missing core details");
  if (row.evidence_tier === "external_source" && !/^https?:\/\/\S+$/i.test(row.source_url?.trim() ?? "")) issues.push("Missing source link");
  if (!row.evidence_tier || row.evidence_tier === "legacy_unclassified") issues.push("Evidence awaiting review");
  return issues;
}
export function filterBenchmarkReview<T extends Reviewable>(rows: T[], filters: { q: string; status: string; handheld: string; review: string }): T[] {
  const query = filters.q.trim().toLocaleLowerCase("en");
  return rows.filter((row) => {
    if (filters.status && row.status !== filters.status) return false;
    if (filters.handheld && row.handheld_id !== filters.handheld) return false;
    if (query && ![row.id, row.games?.name, row.handhelds?.name, row.resolution, row.tdp].some((value) => value?.toLocaleLowerCase("en").includes(query))) return false;
    const issues = benchmarkReviewIssues(row);
    if (filters.review === "core") return issues.includes("Missing core details");
    if (filters.review === "source") return issues.includes("Missing source link");
    if (filters.review === "evidence") return issues.includes("Evidence awaiting review");
    return true;
  });
}
