"use client";

import { useMemo, useState } from "react";
import SearchableSelect, {
  type SearchableSelectOption,
} from "./SearchableSelect";

type BenchmarkStatus = "draft" | "published" | "archived";

export interface BenchmarkPresetOption {
  id: string;
  name: string;
  game_id: string;
  handheld_id: string;
  preset_type?: string | null;
  games?: {
    name: string;
  } | null;
  handhelds?: {
    name: string;
  } | null;
}

export interface BenchmarkFormDefaults {
  benchmarkId?: string;
  gameId?: string;
  handheldId?: string;
  presetId?: string;
  resolution?: string;
  tdp?: string;
  averageFps?: string;
  onePercentLow?: string;
  batteryLife?: string;
  testNotes?: string;
  status?: BenchmarkStatus;
}

interface BenchmarkAdminFormProps {
  action: (formData: FormData) => void | Promise<void>;
  games: SearchableSelectOption[];
  handhelds: SearchableSelectOption[];
  presets: BenchmarkPresetOption[];
  defaults?: BenchmarkFormDefaults;
  submitLabel: string;
  isBenchmarkTester?: boolean;
  cancelHref?: string;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function numberFromText(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function buildPresetLabel(preset: BenchmarkPresetOption) {
  const parts = [
    preset.games?.name ?? "Unknown game",
    preset.handhelds?.name ?? "Unknown handheld",
    preset.name,
  ];

  if (preset.preset_type) {
    parts.push(preset.preset_type);
  }

  return parts.join(" · ");
}

export default function BenchmarkAdminForm({
  action,
  games,
  handhelds,
  presets,
  defaults,
  submitLabel,
  isBenchmarkTester = false,
  cancelHref = "/admin/benchmarks",
}: BenchmarkAdminFormProps) {
  const [gameId, setGameId] = useState(defaults?.gameId ?? "");
  const [handheldId, setHandheldId] = useState(defaults?.handheldId ?? "");
  const [presetId, setPresetId] = useState(defaults?.presetId ?? "");
  const [resolution, setResolution] = useState(defaults?.resolution ?? "");
  const [tdp, setTdp] = useState(defaults?.tdp ?? "");
  const [averageFps, setAverageFps] = useState(defaults?.averageFps ?? "");
  const [onePercentLow, setOnePercentLow] = useState(
    defaults?.onePercentLow ?? "",
  );
  const [batteryLife, setBatteryLife] = useState(defaults?.batteryLife ?? "");
  const [testNotes, setTestNotes] = useState(defaults?.testNotes ?? "");
  const [status, setStatus] = useState<BenchmarkStatus>(
    defaults?.status ?? "draft",
  );

  const matchingPresets = useMemo(() => {
    const filtered = presets.filter((preset) => {
      if (gameId && preset.game_id !== gameId) {
        return false;
      }

      if (handheldId && preset.handheld_id !== handheldId) {
        return false;
      }

      return true;
    });

    if (!presetId) {
      return filtered;
    }

    const selectedPreset = presets.find((preset) => preset.id === presetId);

    if (
      selectedPreset &&
      !filtered.some((preset) => preset.id === selectedPreset.id)
    ) {
      return [selectedPreset, ...filtered];
    }

    return filtered;
  }, [gameId, handheldId, presetId, presets]);

  const presetOptions = useMemo(
    () =>
      matchingPresets.map((preset) => ({
        id: preset.id,
        name: buildPresetLabel(preset),
      })),
    [matchingPresets],
  );

  const warnings = useMemo(() => {
    const items: string[] = [];
    const average = numberFromText(averageFps);
    const low = numberFromText(onePercentLow);

    if (!resolution.trim()) {
      items.push("Resolution is missing.");
    }

    if (!tdp.trim()) {
      items.push("TDP / power target is missing.");
    }

    if (average === null) {
      items.push("Average FPS is missing.");
    }

    if (low === null) {
      items.push("1% low is missing.");
    }

    if (average !== null && low !== null && low > average) {
      items.push("1% low is higher than average FPS.");
    }

    if (!batteryLife.trim()) {
      items.push("Battery estimate is missing.");
    }

    if (normalize(testNotes).length < 30) {
      items.push("Test notes should include scene, settings or test method.");
    }

    return items;
  }, [averageFps, batteryLife, onePercentLow, resolution, tdp, testNotes]);

  return (
    <form action={action}>
      {defaults?.benchmarkId && (
        <input type="hidden" name="benchmarkId" value={defaults.benchmarkId} />
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <SearchableSelect
          label="Game"
          name="gameId"
          options={games}
          value={gameId}
          onChange={(nextGameId) => {
            setGameId(nextGameId);
            const selectedPreset = presets.find(
              (preset) => preset.id === presetId,
            );

            if (
              selectedPreset &&
              nextGameId &&
              selectedPreset.game_id !== nextGameId
            ) {
              setPresetId("");
            }
          }}
          placeholder="Search game..."
          emptyText="No games found"
          required
        />

        <SearchableSelect
          label="Handheld"
          name="handheldId"
          options={handhelds}
          value={handheldId}
          onChange={(nextHandheldId) => {
            setHandheldId(nextHandheldId);
            const selectedPreset = presets.find(
              (preset) => preset.id === presetId,
            );

            if (
              selectedPreset &&
              nextHandheldId &&
              selectedPreset.handheld_id !== nextHandheldId
            ) {
              setPresetId("");
            }
          }}
          placeholder="Search handheld..."
          emptyText="No handhelds found"
          required
        />

        <SearchableSelect
          label="Related preset"
          name="presetId"
          options={presetOptions}
          value={presetId}
          onChange={setPresetId}
          placeholder="Search linked preset..."
          emptyText={
            gameId && handheldId
              ? "No presets match this game and handheld"
              : "No presets found"
          }
        />

        <FormField
          label="Resolution"
          name="resolution"
          value={resolution}
          onChange={setResolution}
          placeholder="1920 × 1080"
        />

        <FormField
          label="TDP"
          name="tdp"
          value={tdp}
          onChange={setTdp}
          placeholder="30W"
        />

        <FormField
          label="Average FPS"
          name="averageFps"
          type="number"
          value={averageFps}
          onChange={setAverageFps}
          placeholder="68"
          min="0"
          step="0.01"
        />

        <FormField
          label="1% Low"
          name="onePercentLow"
          type="number"
          value={onePercentLow}
          onChange={setOnePercentLow}
          placeholder="54"
          min="0"
          step="0.01"
        />

        <FormField
          label="Battery life"
          name="batteryLife"
          value={batteryLife}
          onChange={setBatteryLife}
          placeholder="1 h 45 min"
        />

        <div>
          <label
            htmlFor="status"
            className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
          >
            Content status
          </label>

          {isBenchmarkTester ? (
            <div className="rounded-xl border border-orange-500/25 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-300">
              Draft locked for Benchmark Tester
              <input type="hidden" name="status" value="draft" />
            </div>
          ) : (
            <select
              id="status"
              name="status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as BenchmarkStatus)
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          )}
        </div>
      </div>

      <div className="mt-6">
        <label
          htmlFor="testNotes"
          className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
        >
          Test notes
        </label>

        <textarea
          id="testNotes"
          name="testNotes"
          rows={7}
          value={testNotes}
          onChange={(event) => setTestNotes(event.target.value)}
          placeholder="Describe test location, graphics settings, frame generation, power mode, temperatures or unusual performance behaviour."
          className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
        />
      </div>

      {warnings.length > 0 ? (
        <div className="mt-6 rounded-2xl border border-orange-500/25 bg-orange-500/10 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
            Benchmark quality hints
          </p>

          <ul className="mt-3 space-y-2 text-sm text-orange-100/90">
            {warnings.map((warning) => (
              <li key={warning}>• {warning}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-green-500/25 bg-green-500/10 p-4 text-sm font-bold text-green-300">
          This benchmark looks complete enough to publish.
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-xl bg-cyan-500 px-6 py-3 font-black text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!gameId || !handheldId}
        >
          {submitLabel}
        </button>

        <a
          href={cancelHref}
          className="rounded-xl border border-slate-700 bg-slate-950 px-6 py-3 font-bold text-slate-300 transition hover:border-slate-500 hover:text-white"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}

interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number";
  min?: string;
  step?: string;
}

function FormField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  step,
}: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        min={min}
        step={step}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
      />
    </div>
  );
}
