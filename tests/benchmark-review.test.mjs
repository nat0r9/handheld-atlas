import test from "node:test";
import assert from "node:assert/strict";
import { benchmarkReviewIssues, filterBenchmarkReview } from "../lib/catalog/benchmark-review.ts";
const row = { id: "record-1", status: "published", handheld_id: "deck", resolution: "1280 × 800", tdp: "15W", average_fps: 40,
  test_notes: "High preset, fixed scene", source_url: "https://example.com/test", evidence_tier: "external_source",
  games: { name: "Cyberpunk 2077" }, handhelds: { name: "Steam Deck OLED" } };
const filters = { q: "", status: "", handheld: "", review: "" };
test("review does not require optional lows or battery measurements and keeps zero FPS", () => {
  assert.deepEqual(benchmarkReviewIssues(row), []);
  assert.deepEqual(benchmarkReviewIssues({ ...row, average_fps: 0 }), []);
  assert.deepEqual(benchmarkReviewIssues({ ...row, average_fps: null }), ["Missing core details"]);
});
test("only external evidence requires a source link; legacy evidence is kept explicit", () => {
  assert.deepEqual(benchmarkReviewIssues({ ...row, source_url: " " }), ["Missing source link"]);
  assert.deepEqual(benchmarkReviewIssues({ ...row, source_url: "javascript:alert(1)" }), ["Missing source link"]);
  assert.deepEqual(benchmarkReviewIssues({ ...row, evidence_tier: "legacy_unclassified", source_url: null }), ["Evidence awaiting review"]);
});
test("search and filters intersect, handle missing joins and do not mutate inputs", () => {
  const draft = { ...row, id: "draft-2", status: "draft", handheld_id: "ally", handhelds: { name: "ROG Ally" }, tdp: null };
  const rows = [row, draft];
  assert.deepEqual(filterBenchmarkReview(rows, { ...filters, q: "CYBERPUNK", status: "draft", handheld: "ally", review: "core" }), [draft]);
  assert.deepEqual(filterBenchmarkReview(rows, { ...filters, q: "Steam Deck", status: "draft" }), []);
  assert.deepEqual(filterBenchmarkReview(rows, { ...filters, q: "record-1" }), [row]);
  assert.deepEqual(filterBenchmarkReview([{ ...row, games: null }], { ...filters, review: "core" }).length, 1);
  assert.equal(rows.length, 2);
});
