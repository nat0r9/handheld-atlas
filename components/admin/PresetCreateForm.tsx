"use client";

import { useState } from "react";

export interface PresetSelectOption {
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

interface PresetCreateFormProps {
  games: PresetSelectOption[];
  handhelds: PresetSelectOption[];
  action: (formData: FormData) => Promise<void>;
  canSetAtlasVerified?: boolean;
}

function createItem(): SettingItem {
  return {
    id: crypto.randomUUID(),
    label: "",
    value: "",
    note: "",
  };
}

function createGroup(): SettingGroup {
  return {
    id: crypto.randomUUID(),
    name: "",
    items: [createItem()],
  };
}

export default function PresetCreateForm({
  games,
  handhelds,
  action,
  canSetAtlasVerified = false,
}: PresetCreateFormProps) {
  const [groups, setGroups] = useState<SettingGroup[]>([
    createGroup(),
  ]);

  const [collapsedGroupIds, setCollapsedGroupIds] = useState<string[]>([]);

  function addGroup() {
    const newGroup = createGroup();

    setGroups((currentGroups) => [
      ...currentGroups,
      newGroup,
    ]);

    setCollapsedGroupIds((currentIds) =>
      currentIds.filter((groupId) => groupId !== newGroup.id),
    );
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

    setCollapsedGroupIds((currentIds) =>
      currentIds.filter(
        (currentGroupId) => currentGroupId !== groupId,
      ),
    );
  }

  function toggleGroup(groupId: string) {
    setCollapsedGroupIds((currentIds) =>
      currentIds.includes(groupId)
        ? currentIds.filter(
            (currentGroupId) => currentGroupId !== groupId,
          )
        : [...currentIds, groupId],
    );
  }

  function collapseAllGroups() {
    setCollapsedGroupIds(
      groups.map((group) => group.id),
    );
  }

  function expandAllGroups() {
    setCollapsedGroupIds([]);
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

  const serializedSettings = JSON.stringify(
    groups.map((group, groupIndex) => ({
      name: group.name.trim(),
      sortOrder: groupIndex,
      items: group.items.map((item, itemIndex) => ({
        label: item.label.trim(),
        value: item.value.trim(),
        note: item.note.trim(),
        sortOrder: itemIndex,
      })),
    })),
  );

  return (
    <form action={action} className="mt-8">
      <input
        type="hidden"
        name="settingsJson"
        value={serializedSettings}
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <SelectField
          label="Game"
          name="gameId"
          required
          options={games}
          placeholder="Select game"
        />

        <SelectField
          label="Handheld"
          name="handheldId"
          required
          options={handhelds}
          placeholder="Select handheld"
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
            defaultValue="Balanced"
            required
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
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
          placeholder="Docked 1080p Quality"
          required
        />

        <FormField
          label="Resolution"
          name="resolution"
          placeholder="1920 × 1080"
        />

        <FormField
          label="TDP"
          name="tdp"
          placeholder="30W"
        />

        <FormField
          label="Average FPS"
          name="fpsAverage"
          type="number"
          placeholder="68"
          min="0"
          step="0.01"
        />

        <FormField
          label="1% Low"
          name="onePercentLow"
          type="number"
          placeholder="54"
          min="0"
          step="0.01"
        />

        <FormField
          label="Upscaler"
          name="upscaler"
          placeholder="FSR 3 Quality"
        />

        <FormField
          label="Battery life"
          name="batteryLife"
          placeholder="1 h 45 min"
        />

        <FormField
          label="Community rating"
          name="communityRating"
          type="number"
          placeholder="4.7"
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
            defaultValue="draft"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {canSetAtlasVerified && (
        <label className="mt-6 flex cursor-pointer items-start gap-4 rounded-2xl border border-green-500/25 bg-green-500/[0.06] p-5">
          <input
            type="checkbox"
            name="atlasVerified"
            className="mt-1 h-5 w-5 rounded border-slate-700 bg-slate-950 accent-green-500"
          />
          <span>
            <span className="block text-sm font-black text-green-300">
              Mark as Atlas Verified
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">
              Use only after an editor checks the target device, resolution,
              TDP, performance data and the complete settings list.
            </span>
          </span>
        </label>
      )}

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
          rows={4}
          placeholder="Describe the purpose, expected performance and important caveats."
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

            <h3 className="mt-2 text-3xl font-black">
              Settings groups
            </h3>

            <p className="mt-3 max-w-2xl text-slate-400">
              Create any groups and settings used by
              this particular game.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {groups.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={collapseAllGroups}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-bold text-slate-300 transition hover:border-cyan-500/50 hover:text-cyan-400"
                >
                  Collapse all
                </button>

                <button
                  type="button"
                  onClick={expandAllGroups}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-bold text-slate-300 transition hover:border-cyan-500/50 hover:text-cyan-400"
                >
                  Expand all
                </button>
              </>
            )}

            <button
              type="button"
              onClick={addGroup}
              className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-3 text-sm font-bold text-cyan-400 transition hover:bg-cyan-500 hover:text-slate-950"
            >
              + Add settings group
            </button>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center">
            <p className="font-bold text-slate-300">
              No settings groups
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Add a group such as Graphics, Display or
              AMD Software.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {groups.map((group, groupIndex) => {
              const isCollapsed =
                collapsedGroupIds.includes(group.id);

              return (
                <article
                  key={group.id}
                  className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/70"
                >
                  <div className="flex flex-wrap items-end gap-4 p-5">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      aria-expanded={!isCollapsed}
                      aria-controls={`group-content-${group.id}`}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-xl font-black text-cyan-400 transition hover:bg-cyan-500 hover:text-slate-950"
                    >
                      {isCollapsed ? "+" : "−"}
                    </button>

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

                      <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-600">
                        {group.items.length}{" "}
                        {group.items.length === 1
                          ? "setting"
                          : "settings"}
                        {isCollapsed
                          ? " · collapsed"
                          : " · expanded"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => addItem(group.id)}
                      className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-sm font-bold text-cyan-400 transition hover:bg-cyan-500 hover:text-slate-950"
                    >
                      + Add setting
                    </button>

                    <button
                      type="button"
                      onClick={() => removeGroup(group.id)}
                      className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400 transition hover:bg-red-500 hover:text-white"
                    >
                      Delete group
                    </button>
                  </div>

                  <div
                    id={`group-content-${group.id}`}
                    className={`grid transition-all duration-300 ${
                      isCollapsed
                        ? "grid-rows-[0fr] opacity-0"
                        : "grid-rows-[1fr] opacity-100"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-4 border-t border-slate-800 p-5">
                        {group.items.map(
                          (item, itemIndex) => (
                            <div
                              key={item.id}
                              className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 lg:grid-cols-[1fr_1fr_1fr_auto]"
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
                    </div>
                  </div>
                </article>
              );
            })}
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
        Create preset
      </button>
    </form>
  );
}

interface FormFieldProps {
  label: string;
  name: string;
  placeholder?: string;
  type?: "text" | "number";
  required?: boolean;
  min?: string;
  max?: string;
  step?: string;
}

function FormField({
  label,
  name,
  placeholder,
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
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  name: string;
  options: PresetSelectOption[];
  placeholder: string;
  required?: boolean;
}

function SelectField({
  label,
  name,
  options,
  placeholder,
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
        defaultValue=""
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
      >
        <option value="" disabled>
          {placeholder}
        </option>

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
