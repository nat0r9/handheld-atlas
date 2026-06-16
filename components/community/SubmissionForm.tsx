"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  getSubmissionReadiness,
  type SubmissionGroupInput,
} from "../../lib/submission-workflow";
import SubmissionReadinessPanel from "./SubmissionReadinessPanel";

export interface SubmissionSelectOption {
  id: string;
  name: string;
}

interface SettingItem {
  id: string;
  label: string;
  value: string;
  note: string;
}

interface SettingGroup {
  id: string;
  name: string;
  items: SettingItem[];
}

export interface SubmissionInitialData {
  id: string;
  gameId: string;
  handheldId: string;
  name: string;
  presetType:
    | "Performance"
    | "Balanced"
    | "Battery"
    | "Docked"
    | "Custom";
  resolution: string;
  tdp: string;
  fpsAverage: string;
  onePercentLow: string;
  upscaler: string;
  batteryLife: string;
  summary: string;
  groups: Array<{
    id: string;
    name: string;
    items: Array<{
      id: string;
      label: string;
      value: string;
      note: string;
    }>;
  }>;
}

interface SubmissionFormProps {
  games: SubmissionSelectOption[];
  handhelds: SubmissionSelectOption[];
  action: (formData: FormData) => Promise<void>;
  initialData?: SubmissionInitialData;
  mode?: "create" | "edit";
}

function createItem(id = crypto.randomUUID()): SettingItem {
  return {
    id,
    label: "",
    value: "",
    note: "",
  };
}

function createGroup(
  id = crypto.randomUUID(),
  itemId = crypto.randomUUID(),
): SettingGroup {
  return {
    id,
    name: "",
    items: [createItem(itemId)],
  };
}

function createInitialGroups(): SettingGroup[] {
  return [createGroup("initial-group", "initial-setting")];
}

export default function SubmissionForm({
  games,
  handhelds,
  action,
  initialData,
  mode = "create",
}: SubmissionFormProps) {
  const [gameId, setGameId] = useState(
    initialData?.gameId ?? "",
  );
  const [handheldId, setHandheldId] = useState(
    initialData?.handheldId ?? "",
  );
  const [name, setName] = useState(
    initialData?.name ?? "",
  );
  const [presetType, setPresetType] = useState(
    initialData?.presetType ?? "Balanced",
  );
  const [resolution, setResolution] = useState(
    initialData?.resolution ?? "",
  );
  const [tdp, setTdp] = useState(
    initialData?.tdp ?? "",
  );
  const [fpsAverage, setFpsAverage] = useState(
    initialData?.fpsAverage ?? "",
  );
  const [onePercentLow, setOnePercentLow] = useState(
    initialData?.onePercentLow ?? "",
  );
  const [upscaler, setUpscaler] = useState(
    initialData?.upscaler ?? "",
  );
  const [batteryLife, setBatteryLife] = useState(
    initialData?.batteryLife ?? "",
  );
  const [summary, setSummary] = useState(
    initialData?.summary ?? "",
  );
  const [groups, setGroups] = useState<SettingGroup[]>(
    initialData?.groups.length
      ? initialData.groups
      : createInitialGroups(),
  );

  const [collapsedGroupIds, setCollapsedGroupIds] =
    useState<string[]>([]);

  function addGroup() {
    setGroups((currentGroups) => [
      ...currentGroups,
      createGroup(),
    ]);
  }

  function removeGroup(groupId: string) {
    setGroups((currentGroups) => {
      const nextGroups = currentGroups.filter(
        (group) => group.id !== groupId,
      );

      return nextGroups.length > 0
        ? nextGroups
        : [createGroup()];
    });

    setCollapsedGroupIds((currentIds) =>
      currentIds.filter((id) => id !== groupId),
    );
  }

  function updateGroupName(groupId: string, value: string) {
    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === groupId
          ? { ...group, name: value }
          : group,
      ),
    );
  }

  function toggleGroup(groupId: string) {
    setCollapsedGroupIds((currentIds) =>
      currentIds.includes(groupId)
        ? currentIds.filter((id) => id !== groupId)
        : [...currentIds, groupId],
    );
  }

  function addItem(groupId: string) {
    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              items: [...group.items, createItem()],
            }
          : group,
      ),
    );
  }

  function removeItem(groupId: string, itemId: string) {
    setGroups((currentGroups) =>
      currentGroups.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        const nextItems = group.items.filter(
          (item) => item.id !== itemId,
        );

        return {
          ...group,
          items:
            nextItems.length > 0
              ? nextItems
              : [createItem()],
        };
      }),
    );
  }

  function updateItem(
    groupId: string,
    itemId: string,
    field: keyof Omit<SettingItem, "id">,
    value: string,
  ) {
    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              items: group.items.map((item) =>
                item.id === itemId
                  ? { ...item, [field]: value }
                  : item,
              ),
            }
          : group,
      ),
    );
  }

  const serializedSettings = useMemo(
    () =>
      JSON.stringify(
        groups.map((group, groupIndex) => ({
          name: group.name,
          sortOrder: groupIndex,
          items: group.items.map((item, itemIndex) => ({
            label: item.label,
            value: item.value,
            note: item.note,
            sortOrder: itemIndex,
          })),
        })),
      ),
    [groups],
  );

  const readinessGroups: SubmissionGroupInput[] = groups.map(
    (group) => ({
      name: group.name,
      items: group.items.map((item) => ({
        label: item.label,
        value: item.value,
      })),
    }),
  );

  const readiness = getSubmissionReadiness({
    gameId,
    handheldId,
    name,
    resolution,
    tdp,
    fpsAverage,
    onePercentLow,
    batteryLife,
    summary,
    groups: readinessGroups,
  });

  return (
    <form action={action} className="atlas-panel p-4 sm:p-6">
      <input
        type="hidden"
        name="settingsJson"
        value={serializedSettings}
      />

      {initialData && (
        <input
          type="hidden"
          name="submissionId"
          value={initialData.id}
        />
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <SelectField
          label="Game"
          name="gameId"
          placeholder="Select game"
          options={games}
          required
          value={gameId}
          onChange={setGameId}
        />

        <SelectField
          label="Handheld"
          name="handheldId"
          placeholder="Select handheld"
          options={handhelds}
          required
          value={handheldId}
          onChange={setHandheldId}
        />

        <div>
          <FieldLabel htmlFor="presetType" label="Preset type" />

          <select
            id="presetType"
            name="presetType"
            value={presetType}
            onChange={(event) =>
              setPresetType(
                event.target.value as typeof presetType,
              )
            }
            className="w-full rounded-xl border border-white/[0.09] bg-black/30 px-4 py-3.5 text-white outline-none transition focus:border-cyan-500"
          >
            <option value="Performance">Performance</option>
            <option value="Balanced">Balanced</option>
            <option value="Battery">Battery</option>
            <option value="Docked">Docked</option>
            <option value="Custom">Custom</option>
          </select>
        </div>

        <FormField
          label="Preset name"
          name="name"
          placeholder="Balanced 60 FPS"
          required
          value={name}
          onChange={setName}
        />

        <FormField
          label="Resolution"
          name="resolution"
          placeholder="1600 × 900"
          value={resolution}
          onChange={setResolution}
        />

        <FormField
          label="TDP"
          name="tdp"
          placeholder="18W"
          value={tdp}
          onChange={setTdp}
        />

        <FormField
          label="Average FPS"
          name="fpsAverage"
          type="number"
          min="0"
          step="0.01"
          placeholder="60"
          value={fpsAverage}
          onChange={setFpsAverage}
        />

        <FormField
          label="1% Low"
          name="onePercentLow"
          type="number"
          min="0"
          step="0.01"
          placeholder="48"
          value={onePercentLow}
          onChange={setOnePercentLow}
        />

        <FormField
          label="Upscaler"
          name="upscaler"
          placeholder="FSR 2 Quality"
          value={upscaler}
          onChange={setUpscaler}
        />

        <FormField
          label="Battery life"
          name="batteryLife"
          placeholder="3 hours"
          value={batteryLife}
          onChange={setBatteryLife}
        />
      </div>

      <div className="mt-6">
        <FieldLabel htmlFor="summary" label="Summary" />

        <textarea
          id="summary"
          name="summary"
          rows={5}
          maxLength={1200}
          placeholder="Describe what this preset targets, where it was tested and any important caveats."
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          className="w-full resize-y rounded-xl border border-white/[0.09] bg-black/30 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-500"
        />

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <span>
            Include test conditions, target experience and visible trade-offs.
          </span>
          <span>{summary.trim().length}/1200</span>
        </div>
      </div>

      <section className="mt-9 border-t border-white/[0.07] pt-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="atlas-section-label">Detailed settings</p>

            <h2 className="mt-2 text-2xl font-black">
              Settings groups
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setCollapsedGroupIds(
                  groups.map((group) => group.id),
                )
              }
              className="atlas-button-secondary"
            >
              Collapse all
            </button>

            <button
              type="button"
              onClick={() => setCollapsedGroupIds([])}
              className="atlas-button-secondary"
            >
              Expand all
            </button>

            <button
              type="button"
              onClick={addGroup}
              className="atlas-button-primary"
            >
              + Add group
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {groups.map((group, groupIndex) => {
            const isCollapsed = collapsedGroupIds.includes(
              group.id,
            );

            return (
              <article
                key={group.id}
                className="overflow-hidden rounded-2xl border border-white/[0.07] bg-black/20"
              >
                <div className="flex flex-wrap items-end gap-3 p-4">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-lg font-black text-cyan-400"
                    aria-label={
                      isCollapsed
                        ? `Expand group ${groupIndex + 1}`
                        : `Collapse group ${groupIndex + 1}`
                    }
                  >
                    {isCollapsed ? "+" : "−"}
                  </button>

                  <div className="min-w-52 flex-1">
                    <FieldLabel
                      htmlFor={`group-${group.id}`}
                      label={`Group ${groupIndex + 1}`}
                    />

                    <input
                      id={`group-${group.id}`}
                      type="text"
                      value={group.name}
                      onChange={(event) =>
                        updateGroupName(
                          group.id,
                          event.target.value,
                        )
                      }
                      placeholder="Graphics"
                      className="w-full rounded-xl border border-white/[0.09] bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                    />

                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.1em] text-slate-600">
                      {group.items.length}{" "}
                      {group.items.length === 1
                        ? "setting"
                        : "settings"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => addItem(group.id)}
                    className="atlas-button-secondary"
                  >
                    + Add setting
                  </button>

                  <button
                    type="button"
                    onClick={() => removeGroup(group.id)}
                    className="rounded-xl border border-red-500/25 bg-red-500/[0.07] px-4 py-3 text-sm font-black text-red-400 transition hover:bg-red-500 hover:text-white"
                  >
                    Delete group
                  </button>
                </div>

                {!isCollapsed && (
                  <div className="space-y-3 border-t border-white/[0.07] p-4">
                    {group.items.map((item, itemIndex) => (
                      <div
                        key={item.id}
                        className="grid gap-3 rounded-xl border border-white/[0.07] bg-[#060911] p-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,0.55fr)_minmax(0,1.25fr)_auto]"
                      >
                        <FormInput
                          label={`Setting ${itemIndex + 1}`}
                          value={item.label}
                          placeholder="Texture Quality"
                          onChange={(value) =>
                            updateItem(
                              group.id,
                              item.id,
                              "label",
                              value,
                            )
                          }
                        />

                        <FormInput
                          label="Value"
                          value={item.value}
                          placeholder="High"
                          onChange={(value) =>
                            updateItem(
                              group.id,
                              item.id,
                              "value",
                              value,
                            )
                          }
                        />

                        <FormNoteInput
                          label="Why this setting"
                          value={item.note}
                          placeholder="Default: Ultra | Problem: GPU load | FPS: +4–6 | Visual: Low"
                          onChange={(value) =>
                            updateItem(
                              group.id,
                              item.id,
                              "note",
                              value,
                            )
                          }
                        />

                        <button
                          type="button"
                          onClick={() =>
                            removeItem(group.id, item.id)
                          }
                          className="self-end rounded-xl border border-red-500/25 bg-red-500/[0.07] px-4 py-3 text-sm font-black text-red-400 transition hover:bg-red-500 hover:text-white"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <div className="mt-8 border-t border-white/[0.07] pt-7">
        <SubmissionReadinessPanel readiness={readiness} />
      </div>

      <SubmissionActions
        mode={mode}
        isReady={readiness.isReady}
        missingChecks={readiness.issues}
      />
    </form>
  );
}

function SubmissionActions({
  mode,
  isReady,
  missingChecks,
}: {
  mode: "create" | "edit";
  isReady: boolean;
  missingChecks: string[];
}) {
  const { pending } = useFormStatus();

  return (
    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-6 sm:flex-row sm:items-end sm:justify-between">
      <Link
        href="/my-submissions"
        className="atlas-button-secondary text-center"
      >
        Cancel
      </Link>

      <div className="sm:text-right">
        {!isReady && (
          <p className="mb-3 max-w-xl text-xs leading-5 text-orange-300/80">
            Review is locked until these checks are complete: {missingChecks.join(", ")}.
          </p>
        )}

        <div className="grid gap-3 sm:flex sm:justify-end">
          <button
            type="submit"
            name="intent"
            value="draft"
            disabled={pending}
            className="atlas-button-secondary disabled:cursor-wait disabled:opacity-60"
          >
            {pending
              ? "Saving…"
              : mode === "edit"
                ? "Save as draft"
                : "Save draft"}
          </button>

          <button
            type="submit"
            name="intent"
            value="submit"
            disabled={pending || !isReady}
            className="atlas-button-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending
              ? "Submitting…"
              : mode === "edit"
                ? "Resubmit for review"
                : "Submit for review"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({
  htmlFor,
  label,
}: {
  htmlFor: string;
  label: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-[0.58rem] font-black uppercase tracking-[0.14em] text-slate-600"
    >
      {label}
    </label>
  );
}

interface FormFieldProps {
  label: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: "text" | "number";
  min?: string;
  step?: string;
}

function FormField({
  label,
  name,
  placeholder,
  value,
  onChange,
  required = false,
  type = "text",
  min,
  step,
}: FormFieldProps) {
  return (
    <div>
      <FieldLabel htmlFor={name} label={label} />

      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        min={min}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/[0.09] bg-black/30 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-500"
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  name: string;
  placeholder: string;
  options: SubmissionSelectOption[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

function SelectField({
  label,
  name,
  placeholder,
  options,
  value,
  onChange,
  required = false,
}: SelectFieldProps) {
  return (
    <div>
      <FieldLabel htmlFor={name} label={label} />

      <select
        id={name}
        name={name}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/[0.09] bg-black/30 px-4 py-3.5 text-white outline-none transition focus:border-cyan-500"
      >
        <option value="" disabled>
          {placeholder}
        </option>

        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function FormInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[0.58rem] font-black uppercase tracking-[0.14em] text-slate-600">
        {label}
      </p>

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/[0.09] bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-500"
      />
    </div>
  );
}

function FormNoteInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[0.58rem] font-black uppercase tracking-[0.14em] text-slate-600">
        {label}
      </p>

      <textarea
        rows={3}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-xl border border-white/[0.09] bg-black/30 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-500"
      />
    </div>
  );
}
