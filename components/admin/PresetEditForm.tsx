"use client";

import { useState } from "react";

export interface PresetEditSelectOption {
  id: string;
  name: string;
}

export interface PresetEditSettingItem {
  id: string;
  label: string;
  value: string;
  note: string;
}

export interface PresetEditSettingGroup {
  id: string;
  name: string;
  items: PresetEditSettingItem[];
}

export interface EditablePreset {
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
  communityRating: string;
  summary: string;
  status: "draft" | "published" | "archived";
  groups: PresetEditSettingGroup[];
}

interface PresetEditFormProps {
  preset: EditablePreset;
  games: PresetEditSelectOption[];
  handhelds: PresetEditSelectOption[];
  action: (formData: FormData) => Promise<void>;
}

function createItem(): PresetEditSettingItem {
  return {
    id: crypto.randomUUID(),
    label: "",
    value: "",
    note: "",
  };
}

function createGroup(): PresetEditSettingGroup {
  return {
    id: crypto.randomUUID(),
    name: "",
    items: [createItem()],
  };
}

export default function PresetEditForm({
  preset,
  games,
  handhelds,
  action,
}: PresetEditFormProps) {
  const [groups, setGroups] = useState<
    PresetEditSettingGroup[]
  >(
    preset.groups.length > 0
      ? preset.groups
      : [createGroup()],
  );

  function addGroup() {
    setGroups((currentGroups) => [
      ...currentGroups,
      createGroup(),
    ]);
  }

  function updateGroupName(
    groupId: string,
    name: string,
  ) {
    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              name,
            }
          : group,
      ),
    );
  }

  function removeGroup(groupId: string) {
    setGroups((currentGroups) =>
      currentGroups.filter(
        (group) => group.id !== groupId,
      ),
    );
  }

  function moveGroup(
    groupIndex: number,
    direction: "up" | "down",
  ) {
    setGroups((currentGroups) => {
      const targetIndex =
        direction === "up"
          ? groupIndex - 1
          : groupIndex + 1;

      if (
        targetIndex < 0 ||
        targetIndex >= currentGroups.length
      ) {
        return currentGroups;
      }

      const updatedGroups = [...currentGroups];

      [
        updatedGroups[groupIndex],
        updatedGroups[targetIndex],
      ] = [
        updatedGroups[targetIndex],
        updatedGroups[groupIndex],
      ];

      return updatedGroups;
    });
  }

  function addItem(groupId: string) {
    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              items: [
                ...group.items,
                createItem(),
              ],
            }
          : group,
      ),
    );
  }

  function updateItem(
    groupId: string,
    itemId: string,
    field: "label" | "value" | "note",
    value: string,
  ) {
    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              items: group.items.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      [field]: value,
                    }
                  : item,
              ),
            }
          : group,
      ),
    );
  }

  function removeItem(
    groupId: string,
    itemId: string,
  ) {
    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              items: group.items.filter(
                (item) => item.id !== itemId,
              ),
            }
          : group,
      ),
    );
  }

  function moveItem(
    groupId: string,
    itemIndex: number,
    direction: "up" | "down",
  ) {
    setGroups((currentGroups) =>
      currentGroups.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        const targetIndex =
          direction === "up"
            ? itemIndex - 1
            : itemIndex + 1;

        if (
          targetIndex < 0 ||
          targetIndex >= group.items.length
        ) {
          return group;
        }

        const updatedItems = [...group.items];

        [
          updatedItems[itemIndex],
          updatedItems[targetIndex],
        ] = [
          updatedItems[targetIndex],
          updatedItems[itemIndex],
        ];

        return {
          ...group,
          items: updatedItems,
        };
      }),
    );
  }

  const serializedSettings = JSON.stringify(
    groups.map((group, groupIndex) => ({
      name: group.name.trim(),
      sortOrder: groupIndex,
      items: group.items.map(
        (item, itemIndex) => ({
          label: item.label.trim(),
          value: item.value.trim(),
          note: item.note.trim(),
          sortOrder: itemIndex,
        }),
      ),
    })),
  );

  return (
    <form action={action}>
      <input
        type="hidden"
        name="presetId"
        value={preset.id}
      />

      <input
        type="hidden"
        name="settingsJson"
        value={serializedSettings}
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <SelectField
          label="Game"
          name="gameId"
          options={games}
          defaultValue={preset.gameId}
          required
        />

        <SelectField
          label="Handheld"
          name="handheldId"
          options={handhelds}
          defaultValue={preset.handheldId}
          required
        />

        <div>
          <label
            htmlFor="presetType"
            className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
          >
            Preset type
          </label>

          <select
            id="presetType"
            name="presetType"
            defaultValue={preset.presetType}
            required
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
          >
            <option value="Performance">
              Performance
            </option>

            <option value="Balanced">
              Balanced
            </option>

            <option value="Battery">
              Battery
            </option>

            <option value="Docked">
              Docked
            </option>

            <option value="Custom">
              Custom
            </option>
          </select>
        </div>

        <FormField
          label="Preset name"
          name="name"
          defaultValue={preset.name}
          required
        />

        <FormField
          label="Resolution"
          name="resolution"
          defaultValue={preset.resolution}
        />

        <FormField
          label="TDP"
          name="tdp"
          defaultValue={preset.tdp}
        />

        <FormField
          label="Average FPS"
          name="fpsAverage"
          type="number"
          defaultValue={preset.fpsAverage}
          min="0"
          step="0.01"
        />

        <FormField
          label="1% Low"
          name="onePercentLow"
          type="number"
          defaultValue={preset.onePercentLow}
          min="0"
          step="0.01"
        />

        <FormField
          label="Upscaler"
          name="upscaler"
          defaultValue={preset.upscaler}
        />

        <FormField
          label="Battery life"
          name="batteryLife"
          defaultValue={preset.batteryLife}
        />

        <FormField
          label="Community rating"
          name="communityRating"
          type="number"
          defaultValue={preset.communityRating}
          min="0"
          max="5"
          step="0.01"
        />

        <div>
          <label
            htmlFor="status"
            className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
          >
            Content status
          </label>

          <select
            id="status"
            name="status"
            defaultValue={preset.status}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
          >
            <option value="draft">Draft</option>

            <option value="published">
              Published
            </option>

            <option value="archived">
              Archived
            </option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        <label
          htmlFor="summary"
          className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
        >
          Preset summary
        </label>

        <textarea
          id="summary"
          name="summary"
          rows={5}
          defaultValue={preset.summary}
          placeholder="Describe the expected performance and important caveats."
          className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
        />
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-4 text-sm text-slate-400 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-400">
            Feedback-ready preset
          </p>
          <p className="mt-2 leading-6">
            The summary should explain the target, expected performance and the
            main trade-off. Do not just dump settings and vanish into the fog.
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            Structured setting note format
          </p>
          <code className="mt-2 block whitespace-pre-wrap break-words text-xs leading-6 text-slate-300">
            Default: High | Problem: CPU bottleneck | Why: Crowd density hits the CPU hardest | FPS: +3–6 FPS | Visual: Low | Restart: No
          </code>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Every label is optional. Plain notes still work; structured labels
            unlock Problem → Solution cards on the public preset page.
          </p>
        </div>
      </div>

      <section className="mt-10 border-t border-slate-800 pt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
              Detailed Settings
            </p>

            <h2 className="mt-2 text-3xl font-black">
              Settings groups
            </h2>

            <p className="mt-3 max-w-2xl text-slate-400">
              Edit any game-specific settings. Group and
              row order determines how they appear on the
              public page.
            </p>
          </div>

          <button
            type="button"
            onClick={addGroup}
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-3 text-sm font-bold text-cyan-400 transition hover:bg-cyan-500 hover:text-slate-950"
          >
            + Add settings group
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center">
            <p className="font-bold text-slate-300">
              No settings groups
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Add a group such as Display, Graphics,
              Gameplay or AMD Software.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {groups.map((group, groupIndex) => (
              <article
                key={group.id}
                className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5"
              >
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-60 flex-1">
                    <label
                      htmlFor={`group-${group.id}`}
                      className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                    >
                      Group {groupIndex + 1}
                    </label>

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
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={groupIndex === 0}
                    onClick={() =>
                      moveGroup(groupIndex, "up")
                    }
                    className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-bold text-slate-300 transition hover:border-cyan-500 hover:text-cyan-400 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ↑
                  </button>

                  <button
                    type="button"
                    disabled={
                      groupIndex === groups.length - 1
                    }
                    onClick={() =>
                      moveGroup(groupIndex, "down")
                    }
                    className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-bold text-slate-300 transition hover:border-cyan-500 hover:text-cyan-400 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ↓
                  </button>

                  <button
                    type="button"
                    onClick={() => addItem(group.id)}
                    className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-sm font-bold text-cyan-400 transition hover:bg-cyan-500 hover:text-slate-950"
                  >
                    + Add setting
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      removeGroup(group.id)
                    }
                    className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400 transition hover:bg-red-500 hover:text-white"
                  >
                    Delete group
                  </button>
                </div>

                {group.items.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed border-slate-800 p-6 text-center">
                    <p className="text-sm text-slate-500">
                      This group has no settings yet.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    {group.items.map(
                      (item, itemIndex) => (
                        <div
                          key={item.id}
                          className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 xl:grid-cols-[1fr_1fr_1fr_auto_auto_auto]"
                        >
                          <div>
                            <label
                              htmlFor={`label-${item.id}`}
                              className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-slate-500"
                            >
                              Setting {itemIndex + 1}
                            </label>

                            <input
                              id={`label-${item.id}`}
                              type="text"
                              value={item.label}
                              onChange={(event) =>
                                updateItem(
                                  group.id,
                                  item.id,
                                  "label",
                                  event.target.value,
                                )
                              }
                              placeholder="Texture Quality"
                              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={`value-${item.id}`}
                              className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-slate-500"
                            >
                              Value
                            </label>

                            <input
                              id={`value-${item.id}`}
                              type="text"
                              value={item.value}
                              onChange={(event) =>
                                updateItem(
                                  group.id,
                                  item.id,
                                  "value",
                                  event.target.value,
                                )
                              }
                              placeholder="High"
                              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={`note-${item.id}`}
                              className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-slate-500"
                            >
                              Note
                            </label>

                            <textarea
                              id={`note-${item.id}`}
                              rows={4}
                              value={item.note}
                              onChange={(event) =>
                                updateItem(
                                  group.id,
                                  item.id,
                                  "note",
                                  event.target.value,
                                )
                              }
                              placeholder="Why this value? Add Problem, FPS, Visual and Restart labels when useful."
                              className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                            />
                          </div>

                          <button
                            type="button"
                            disabled={itemIndex === 0}
                            onClick={() =>
                              moveItem(
                                group.id,
                                itemIndex,
                                "up",
                              )
                            }
                            className="self-end rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-bold text-slate-300 transition hover:border-cyan-500 hover:text-cyan-400 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            ↑
                          </button>

                          <button
                            type="button"
                            disabled={
                              itemIndex ===
                              group.items.length - 1
                            }
                            onClick={() =>
                              moveItem(
                                group.id,
                                itemIndex,
                                "down",
                              )
                            }
                            className="self-end rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-bold text-slate-300 transition hover:border-cyan-500 hover:text-cyan-400 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            ↓
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              removeItem(
                                group.id,
                                item.id,
                              )
                            }
                            className="self-end rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400 transition hover:bg-red-500 hover:text-white"
                          >
                            Delete
                          </button>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <button
        type="submit"
        disabled={
          games.length === 0 ||
          handhelds.length === 0
        }
        className="mt-8 rounded-xl bg-cyan-500 px-7 py-4 font-black text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Save preset changes
      </button>
    </form>
  );
}

interface FormFieldProps {
  label: string;
  name: string;
  defaultValue?: string;
  type?: "text" | "number";
  required?: boolean;
  min?: string;
  max?: string;
  step?: string;
}

function FormField({
  label,
  name,
  defaultValue = "",
  type = "text",
  required = false,
  min,
  max,
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
        defaultValue={defaultValue}
        required={required}
        min={min}
        max={max}
        step={step}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  name: string;
  options: PresetEditSelectOption[];
  defaultValue: string;
  required?: boolean;
}

function SelectField({
  label,
  name,
  options,
  defaultValue,
  required = false,
}: SelectFieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
      >
        {label}
      </label>

      <select
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
      >
        {options.map((option) => (
          <option
            key={option.id}
            value={option.id}
          >
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}