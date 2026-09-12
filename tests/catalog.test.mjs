import test from "node:test";
import assert from "node:assert/strict";
import {
  catalogUrl,
  pageNumber,
  genres,
  powerWatts,
  powerSupply,
  resolutionLabel,
} from "../lib/catalog/query.ts";
import { readAll } from "../lib/catalog/read.ts";
import { settingsSummary, evidenceLabel } from "../lib/benchmarks.ts";

test("catalog links preserve encoded filters and clamp invalid pages", () => {
  const url = new URL(
    catalogUrl("/benchmarks", {
      game: "f1-23",
      handheld: "rog-ally",
      resolution: "1920 × 1080",
      q: "A&B",
      page: 2,
    }),
    "https://www.handheldatlas.com",
  );
  assert.equal(url.searchParams.get("q"), "A&B");
  assert.equal(url.searchParams.get("resolution"), "1920 × 1080");
  assert.equal(url.searchParams.get("page"), "2");
  assert.equal(pageNumber("999", 25), 2);
  assert.equal(pageNumber("-1", 25), 1);
  assert.equal(pageNumber("NaN", 0), 1);
  assert.equal(pageNumber("1e3", 100), 1);
});
test("power filters do not invent unreported wattage or power supply", () => {
  assert.equal(powerWatts("30W (Manual; PL1 30W / PL2 37W)"), "30");
  assert.equal(powerWatts("Performance (~30–35W gaming)"), "");
  assert.equal(powerSupply("30W (Turbo; wall power)"), "plugged");
  assert.equal(powerSupply("15W (Performance; battery)"), "battery");
  assert.equal(powerSupply("15W"), "unknown");
});
test("genre combinations are searchable as individual tags", () =>
  assert.deepEqual(genres("Action, Adventure, RPG"), [
    "Action",
    "Adventure",
    "RPG",
  ]));
test("equivalent resolution spellings share a filter without merging different sizes", () => {
  for (const value of ["1920x1080", "1920 x 1080", "1920 × 1080"])
    assert.equal(resolutionLabel(value), "1920 × 1080");
  assert.notEqual(resolutionLabel("1920x1200"), resolutionLabel("1920x1080"));
  assert.equal(resolutionLabel("1080p (FSR Quality)"), "1080p (FSR Quality)");
});
test("settings extract exact source wording, legacy evidence stays unverified", () => {
  assert.equal(
    settingsSummary("SETTINGS: High; TAA. Historical review from 2024."),
    "High; TAA.",
  );
  assert.equal(settingsSummary("No individual settings supplied."), null);
  assert.equal(
    evidenceLabel("legacy_unclassified"),
    "Evidence awaiting review",
  );
});
test("index reader continues past database page limit", async () => {
  const calls = [];
  const rows = await readAll(async (from, to) => {
    calls.push([from, to]);
    return {
      data:
        from === 0
          ? Array.from({ length: 1000 }, (_, id) => ({ id }))
          : [{ id: 1000 }],
      error: null,
    };
  }, "test index");
  assert.equal(rows.length, 1001);
  assert.deepEqual(calls, [
    [0, 999],
    [1000, 1999],
  ]);
});
test("a failed read never becomes an empty result", async () => {
  const saved = console.error;
  console.error = () => {};
  try {
    await assert.rejects(
      () =>
        readAll(
          async () => ({ data: null, error: { message: "Gateway Timeout" } }),
          "test index",
        ),
      /could not be loaded/,
    );
  } finally {
    console.error = saved;
  }
});
