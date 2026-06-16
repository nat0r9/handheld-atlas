"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useFormStatus } from "react-dom";

export interface PresetEditorSelectOption {
  id: string;
  name: string;
}

export interface PresetEditorSettingItem {
  id: string;
  label: string;
  value: string;
  note: string;
}

export interface PresetEditorSettingGroup {
  id: string;
  name: string;
  items: PresetEditorSettingItem[];
}

export type PresetEditorType =
  | "Performance"
  | "Balanced"
  | "Battery"
  | "Docked"
  | "Custom";

export type PresetEditorStatus =
  | "draft"
  | "published"
  | "archived";

export interface PresetEditorValues {
  gameId: string;
  handheldId: string;
  presetType: PresetEditorType;
  name: string;
  resolution: string;
  tdp: string;
  fpsAverage: string;
  onePercentLow: string;
  upscaler: string;
  batteryLife: string;
  communityRating: string;
  summary: string;
  status: PresetEditorStatus;
  atlasVerified: boolean;
}

interface PresetEditorFormProps {
  mode: "create" | "edit";
  presetId?: string;
  games: PresetEditorSelectOption[];
  handhelds: PresetEditorSelectOption[];
  action: (formData: FormData) => Promise<void>;
  initialValues: PresetEditorValues;
  initialGroups: PresetEditorSettingGroup[];
  canSetAtlasVerified?: boolean;
  lockToDraft?: boolean;
  clearLocalDraftOnLoad?: boolean;
}

interface StoredPresetDraft {
  values: PresetEditorValues;
  groups: PresetEditorSettingGroup[];
  savedAt: string;
}

interface ReadinessCheck {
  label: string;
  complete: boolean;
  detail: string;
}

function createClientId(prefix: string) {
  const uuid = globalThis.crypto?.randomUUID?.();

  return uuid
    ? `${prefix}-${uuid}`
    : `${prefix}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;
}

function createItem(): PresetEditorSettingItem {
  return {
    id: createClientId("preset-setting"),
    label: "",
    value: "",
    note: "",
  };
}

function createGroup(): PresetEditorSettingGroup {
  return {
    id: createClientId("preset-group"),
    name: "",
    items: [createItem()],
  };
}

function moveArrayItem<T>(
  items: T[],
  currentIndex: number,
  direction: "up" | "down",
) {
  const targetIndex =
    direction === "up"
      ? currentIndex - 1
      : currentIndex + 1;

  if (
    targetIndex < 0 ||
    targetIndex >= items.length
  ) {
    return items;
  }

  const nextItems = [...items];

  [nextItems[currentIndex], nextItems[targetIndex]] = [
    nextItems[targetIndex],
    nextItems[currentIndex],
  ];

  return nextItems;
}

function getCompleteSettingCount(
  groups: PresetEditorSettingGroup[],
) {
  return groups.reduce(
    (total, group) =>
      total +
      group.items.filter(
        (item) =>
          item.label.trim().length > 0 &&
          item.value.trim().length > 0,
      ).length,
    0,
  );
}

function getStructuredNoteCount(
  groups: PresetEditorSettingGroup[],
) {
  const structuredPattern =
    /(?:^|\|)\s*(?:default|problem|why|fps|visual|restart)\s*:/i;

  return groups.reduce(
    (total, group) =>
      total +
      group.items.filter((item) =>
        structuredPattern.test(item.note),
      ).length,
    0,
  );
}

const CREATE_DRAFT_STORAGE_KEY =
  "handheldatlas-admin-preset-create-v1";

function normalizeSnapshot(
  values: PresetEditorValues,
  groups: PresetEditorSettingGroup[],
) {
  return JSON.stringify({
    values,
    groups: groups.map((group) => ({
      id: group.id,
      name: group.name,
      items: group.items,
    })),
  });
}

export default function PresetEditorForm({
  mode,
  presetId,
  games,
  handhelds,
  action,
  initialValues,
  initialGroups,
  canSetAtlasVerified = false,
  lockToDraft = false,
  clearLocalDraftOnLoad = false,
}: PresetEditorFormProps) {
  const safeInitialGroups = useMemo(
    () =>
      initialGroups.length > 0
        ? initialGroups
        : [
            {
              id:
                mode === "create"
                  ? "preset-create-initial-group"
                  : "preset-edit-initial-group",
              name: "",
              items: [
                {
                  id:
                    mode === "create"
                      ? "preset-create-initial-setting"
                      : "preset-edit-initial-setting",
                  label: "",
                  value: "",
                  note: "",
                },
              ],
            },
          ],
    [initialGroups, mode],
  );

  const normalizedInitialValues = useMemo(
    () => ({
      ...initialValues,
      status: lockToDraft
        ? ("draft" as const)
        : initialValues.status,
      atlasVerified:
        canSetAtlasVerified &&
        initialValues.atlasVerified,
    }),
    [
      canSetAtlasVerified,
      initialValues,
      lockToDraft,
    ],
  );

  const [values, setValues] =
    useState<PresetEditorValues>(
      normalizedInitialValues,
    );

  const [groups, setGroups] = useState<
    PresetEditorSettingGroup[]
  >(safeInitialGroups);

  const [collapsedGroupIds, setCollapsedGroupIds] =
    useState<string[]>([]);

  const [recoverableDraft, setRecoverableDraft] =
    useState<StoredPresetDraft | null>(null);

  const storageKey =
    mode === "create"
      ? CREATE_DRAFT_STORAGE_KEY
      : `handheldatlas-admin-preset-edit-${presetId ?? "unknown"}-v1`;

  const initialSnapshot = useMemo(
    () =>
      normalizeSnapshot(
        normalizedInitialValues,
        safeInitialGroups,
      ),
    [normalizedInitialValues, safeInitialGroups],
  );

  const currentSnapshot = useMemo(
    () => normalizeSnapshot(values, groups),
    [groups, values],
  );

  const isDirty =
    currentSnapshot !== initialSnapshot;

  useEffect(() => {
    const recoveryTimer = window.setTimeout(() => {
      if (mode === "edit") {
        window.localStorage.removeItem(
          CREATE_DRAFT_STORAGE_KEY,
        );
      }

      if (clearLocalDraftOnLoad) {
        window.localStorage.removeItem(storageKey);
        setRecoverableDraft(null);
        return;
      }

      const storedValue =
        window.localStorage.getItem(storageKey);

      if (!storedValue) {
        return;
      }

      try {
        const parsed = JSON.parse(
          storedValue,
        ) as Partial<StoredPresetDraft>;

        if (
          parsed.values &&
          Array.isArray(parsed.groups) &&
          typeof parsed.savedAt === "string" &&
          normalizeSnapshot(
            parsed.values,
            parsed.groups,
          ) !== initialSnapshot
        ) {
          setRecoverableDraft(
            parsed as StoredPresetDraft,
          );
        }
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }, 0);

    return () => {
      window.clearTimeout(recoveryTimer);
    };
  }, [
    clearLocalDraftOnLoad,
    initialSnapshot,
    mode,
    storageKey,
  ]);

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const saveTimer = window.setTimeout(() => {
      const draft: StoredPresetDraft = {
        values,
        groups,
        savedAt: new Date().toISOString(),
      };

      window.localStorage.setItem(
        storageKey,
        JSON.stringify(draft),
      );
    }, 500);

    return () => {
      window.clearTimeout(saveTimer);
    };
  }, [groups, isDirty, storageKey, values]);

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const warnBeforeUnload = (
      event: BeforeUnloadEvent,
    ) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener(
      "beforeunload",
      warnBeforeUnload,
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        warnBeforeUnload,
      );
    };
  }, [isDirty]);

  const completeSettingCount = useMemo(
    () => getCompleteSettingCount(groups),
    [groups],
  );

  const structuredNoteCount = useMemo(
    () => getStructuredNoteCount(groups),
    [groups],
  );

  const namedContentGroups = useMemo(
    () =>
      groups.filter((group) =>
        group.items.some(
          (item) =>
            item.label.trim() ||
            item.value.trim() ||
            item.note.trim(),
        ),
      ),
    [groups],
  );

  const readinessChecks: ReadinessCheck[] = [
    {
      label: "Core identity",
      complete: Boolean(
        values.gameId &&
          values.handheldId &&
          values.name.trim(),
      ),
      detail:
        "Game, handheld and preset name are selected.",
    },
    {
      label: "Test target",
      complete: Boolean(
        values.resolution.trim() &&
          values.tdp.trim(),
      ),
      detail:
        "Resolution and TDP make the result reproducible.",
    },
    {
      label: "Performance evidence",
      complete: Boolean(
        values.fpsAverage.trim() &&
          values.onePercentLow.trim(),
      ),
      detail:
        "Average FPS and 1% low are both documented.",
    },
    {
      label: "Useful summary",
      complete:
        values.summary.trim().length >= 60,
      detail:
        "At least 60 characters explain purpose and trade-offs.",
    },
    {
      label: "Complete configuration",
      complete: completeSettingCount >= 3,
      detail:
        "At least three settings contain both a label and value.",
    },
    {
      label: "Named settings groups",
      complete:
        namedContentGroups.length > 0 &&
        namedContentGroups.every(
          (group) =>
            group.name.trim().length > 0,
        ),
      detail:
        "Every group containing data has a clear name.",
    },
    {
      label: "Learning context",
      complete: structuredNoteCount > 0,
      detail:
        "At least one structured note explains why a setting changed.",
    },
  ];

  const completedReadinessChecks =
    readinessChecks.filter(
      (check) => check.complete,
    ).length;

  const readinessPercent = Math.round(
    (completedReadinessChecks /
      readinessChecks.length) *
      100,
  );

  const isPublishReady =
    readinessChecks
      .slice(0, 6)
      .every((check) => check.complete);

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

  function updateValue<K extends keyof PresetEditorValues>(
    key: K,
    value: PresetEditorValues[K],
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      [key]: value,
    }));
  }

  function addGroup() {
    const group = createGroup();

    setGroups((currentGroups) => [
      ...currentGroups,
      group,
    ]);

    setCollapsedGroupIds((currentIds) =>
      currentIds.filter(
        (groupId) => groupId !== group.id,
      ),
    );
  }

  function duplicateGroup(groupIndex: number) {
    const sourceGroup = groups[groupIndex];

    if (!sourceGroup) {
      return;
    }

    const duplicatedGroup: PresetEditorSettingGroup = {
      id: createClientId("preset-group"),
      name: sourceGroup.name
        ? `${sourceGroup.name} copy`
        : "",
      items: sourceGroup.items.map((item) => ({
        ...item,
        id: createClientId("preset-setting"),
      })),
    };

    setGroups((currentGroups) => {
      const nextGroups = [...currentGroups];
      nextGroups.splice(
        groupIndex + 1,
        0,
        duplicatedGroup,
      );
      return nextGroups;
    });
  }

  function removeGroup(groupId: string) {
    setGroups((currentGroups) =>
      currentGroups.filter(
        (group) => group.id !== groupId,
      ),
    );

    setCollapsedGroupIds((currentIds) =>
      currentIds.filter(
        (currentGroupId) =>
          currentGroupId !== groupId,
      ),
    );
  }

  function moveGroup(
    groupIndex: number,
    direction: "up" | "down",
  ) {
    setGroups((currentGroups) =>
      moveArrayItem(
        currentGroups,
        groupIndex,
        direction,
      ),
    );
  }

  function updateGroupName(
    groupId: string,
    name: string,
  ) {
    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === groupId
          ? { ...group, name }
          : group,
      ),
    );
  }

  function toggleGroup(groupId: string) {
    setCollapsedGroupIds((currentIds) =>
      currentIds.includes(groupId)
        ? currentIds.filter(
            (currentGroupId) =>
              currentGroupId !== groupId,
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
              items: [
                ...group.items,
                createItem(),
              ],
            }
          : group,
      ),
    );
  }

  function duplicateItem(
    groupId: string,
    itemIndex: number,
  ) {
    setGroups((currentGroups) =>
      currentGroups.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        const sourceItem =
          group.items[itemIndex];

        if (!sourceItem) {
          return group;
        }

        const duplicatedItem = {
          ...sourceItem,
          id: createClientId(
            "preset-setting",
          ),
        };

        const nextItems = [...group.items];
        nextItems.splice(
          itemIndex + 1,
          0,
          duplicatedItem,
        );

        return {
          ...group,
          items: nextItems,
        };
      }),
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
      currentGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              items: moveArrayItem(
                group.items,
                itemIndex,
                direction,
              ),
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
              items: group.items.map(
                (item) =>
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

  function restoreLocalDraft() {
    if (!recoverableDraft) {
      return;
    }

    setValues({
      ...recoverableDraft.values,
      status: lockToDraft
        ? "draft"
        : recoverableDraft.values.status,
      atlasVerified:
        canSetAtlasVerified &&
        recoverableDraft.values.atlasVerified,
    });
    setGroups(recoverableDraft.groups);
    setCollapsedGroupIds([]);
    setRecoverableDraft(null);
  }

  function discardLocalDraft() {
    window.localStorage.removeItem(storageKey);
    setRecoverableDraft(null);
  }

  return (
    <form action={action} className="mt-8">
      {presetId && (
        <input
          type="hidden"
          name="presetId"
          value={presetId}
        />
      )}

      <input
        type="hidden"
        name="settingsJson"
        value={serializedSettings}
      />

      {lockToDraft && (
        <input
          type="hidden"
          name="status"
          value="draft"
        />
      )}

      {recoverableDraft && (
        <section className="mb-6 flex flex-col gap-4 rounded-2xl border border-orange-500/30 bg-orange-500/[0.08] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-black text-orange-200">
              Unsaved local draft found
            </p>
            <p className="mt-2 text-sm leading-6 text-orange-100/65">
              The browser preserved work from {new Intl.DateTimeFormat("en", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(recoverableDraft.savedAt))}. Restore it or keep the database version currently loaded.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={restoreLocalDraft}
              className="rounded-xl bg-orange-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-orange-300"
            >
              Restore draft
            </button>
            <button
              type="button"
              onClick={discardLocalDraft}
              className="rounded-xl border border-orange-400/30 bg-black/20 px-4 py-3 text-sm font-black text-orange-200 transition hover:border-orange-300/60 hover:text-white"
            >
              Discard local copy
            </button>
          </div>
        </section>
      )}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <SelectField
          label="Game"
          name="gameId"
          value={values.gameId}
          onChange={(value) =>
            updateValue("gameId", value)
          }
          required
          options={games}
          placeholder="Select game"
        />

        <SelectField
          label="Handheld"
          name="handheldId"
          value={values.handheldId}
          onChange={(value) =>
            updateValue("handheldId", value)
          }
          required
          options={handhelds}
          placeholder="Select handheld"
        />

        <SelectControl
          label="Preset type"
          name="presetType"
          value={values.presetType}
          onChange={(value) =>
            updateValue(
              "presetType",
              value as PresetEditorType,
            )
          }
          options={[
            "Performance",
            "Balanced",
            "Battery",
            "Docked",
            "Custom",
          ]}
        />

        <TextField
          label="Preset name"
          name="name"
          value={values.name}
          onChange={(value) =>
            updateValue("name", value)
          }
          placeholder="Docked 1080p Quality"
          required
        />

        <TextField
          label="Resolution"
          name="resolution"
          value={values.resolution}
          onChange={(value) =>
            updateValue("resolution", value)
          }
          placeholder="1920 × 1080"
        />

        <TextField
          label="TDP"
          name="tdp"
          value={values.tdp}
          onChange={(value) =>
            updateValue("tdp", value)
          }
          placeholder="30W"
        />

        <TextField
          label="Average FPS"
          name="fpsAverage"
          value={values.fpsAverage}
          onChange={(value) =>
            updateValue("fpsAverage", value)
          }
          type="number"
          placeholder="68"
          min="0"
          step="0.01"
        />

        <TextField
          label="1% Low"
          name="onePercentLow"
          value={values.onePercentLow}
          onChange={(value) =>
            updateValue("onePercentLow", value)
          }
          type="number"
          placeholder="54"
          min="0"
          step="0.01"
        />

        <TextField
          label="Upscaler"
          name="upscaler"
          value={values.upscaler}
          onChange={(value) =>
            updateValue("upscaler", value)
          }
          placeholder="FSR 3 Quality"
        />

        <TextField
          label="Battery life"
          name="batteryLife"
          value={values.batteryLife}
          onChange={(value) =>
            updateValue("batteryLife", value)
          }
          placeholder="1 h 45 min"
        />

        <TextField
          label="Community rating"
          name="communityRating"
          value={values.communityRating}
          onChange={(value) =>
            updateValue(
              "communityRating",
              value,
            )
          }
          type="number"
          placeholder="4.7"
          min="0"
          max="5"
          step="0.01"
        />

        {lockToDraft ? (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Content status
            </p>

            <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/[0.07] px-4 py-3 font-bold text-cyan-300">
              Draft — tester workspace
            </div>
          </div>
        ) : (
          <SelectControl
            label="Content status"
            name="status"
            value={values.status}
            onChange={(value) =>
              updateValue(
                "status",
                value as PresetEditorStatus,
              )
            }
            options={[
              "draft",
              "published",
              "archived",
            ]}
            optionLabels={{
              draft: "Draft",
              published: "Published",
              archived: "Archived",
            }}
          />
        )}
      </section>

      {canSetAtlasVerified && (
        <label className="mt-6 flex cursor-pointer items-start gap-4 rounded-2xl border border-green-500/25 bg-green-500/[0.06] p-5">
          <input
            type="checkbox"
            name="atlasVerified"
            checked={values.atlasVerified}
            onChange={(event) =>
              updateValue(
                "atlasVerified",
                event.target.checked,
              )
            }
            className="mt-1 h-5 w-5 rounded border-slate-700 bg-slate-950 accent-green-500"
          />

          <span>
            <span className="block text-sm font-black text-green-300">
              Mark as Atlas Verified
            </span>

            <span className="mt-1 block text-xs leading-5 text-slate-500">
              Use only after checking the target device, resolution, TDP,
              performance evidence and complete configuration.
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
          rows={5}
          value={values.summary}
          onChange={(event) =>
            updateValue(
              "summary",
              event.target.value,
            )
          }
          placeholder="Describe the target, expected performance, visual trade-offs and any important caveats."
          className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
        />

        <div className="mt-2 flex items-center justify-between gap-4 text-xs text-slate-600">
          <span>
            Aim for a useful explanation, not a settings graveyard.
          </span>
          <span>
            {values.summary.trim().length} characters
          </span>
        </div>
      </div>

      <section className="mt-8 grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-400">
                Publication readiness
              </p>
              <p className="mt-2 text-3xl font-black text-white">
                {readinessPercent}%
              </p>
            </div>

            <span
              className={`rounded-full border px-3 py-1 text-[0.58rem] font-black uppercase tracking-[0.12em] ${
                isPublishReady
                  ? "border-green-500/30 bg-green-500/10 text-green-300"
                  : "border-orange-500/30 bg-orange-500/10 text-orange-300"
              }`}
            >
              {isPublishReady
                ? "Ready to publish"
                : "Needs evidence"}
            </span>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-cyan-400 transition-all"
              style={{
                width: `${readinessPercent}%`,
              }}
            />
          </div>

          {values.status === "published" &&
            !isPublishReady && (
              <p className="mt-4 rounded-xl border border-orange-500/25 bg-orange-500/[0.08] p-3 text-xs leading-5 text-orange-200">
                Published was selected, but the preset still lacks core evidence.
                The server will reject incomplete publication instead of shipping
                half a map into the wilderness.
              </p>
            )}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {readinessChecks.map((check) => (
            <div
              key={check.label}
              className={`rounded-xl border p-3 ${
                check.complete
                  ? "border-green-500/20 bg-green-500/[0.05]"
                  : "border-white/[0.07] bg-black/15"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={
                    check.complete
                      ? "text-green-400"
                      : "text-slate-600"
                  }
                >
                  {check.complete ? "✓" : "○"}
                </span>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-300">
                  {check.label}
                </p>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                {check.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-400">
          Structured setting note
        </p>
        <code className="mt-2 block whitespace-pre-wrap break-words text-xs leading-6 text-slate-300">
          Default: High | Problem: CPU bottleneck | Why: Crowd density hits the CPU hardest | FPS: +3–6 FPS | Visual: Low | Restart: No
        </code>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Labels are optional. Plain notes still work; structured notes unlock
          Default → Recommended and Problem → Solution guidance publicly.
        </p>
      </div>

      <section className="mt-8 overflow-hidden rounded-[1.75rem] border border-slate-800 bg-slate-950/60">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 p-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-400">
              Settings configuration
            </p>
            <h3 className="mt-2 text-2xl font-black text-white">
              {groups.length} groups · {completeSettingCount} complete settings
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={collapseAllGroups}
              disabled={groups.length === 0}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-black text-slate-300 transition hover:border-slate-500 hover:text-white disabled:opacity-40"
            >
              Collapse all
            </button>

            <button
              type="button"
              onClick={expandAllGroups}
              disabled={groups.length === 0}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-black text-slate-300 transition hover:border-slate-500 hover:text-white disabled:opacity-40"
            >
              Expand all
            </button>

            <button
              type="button"
              onClick={addGroup}
              className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-xs font-black text-cyan-300 transition hover:bg-cyan-500 hover:text-slate-950"
            >
              + Add group
            </button>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-lg font-black text-white">
              No settings groups yet
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Add the first group and start with the settings that matter most.
            </p>
            <button
              type="button"
              onClick={addGroup}
              className="mt-5 rounded-xl bg-cyan-500 px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-400"
            >
              Add settings group
            </button>
          </div>
        ) : (
          <div className="space-y-4 p-4 sm:p-5">
            {groups.map((group, groupIndex) => {
              const isCollapsed =
                collapsedGroupIds.includes(group.id);

              return (
                <article
                  key={group.id}
                  className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950"
                >
                  <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end">
                    <button
                      type="button"
                      onClick={() =>
                        toggleGroup(group.id)
                      }
                      aria-expanded={!isCollapsed}
                      aria-controls={`group-content-${group.id}`}
                      title={
                        isCollapsed
                          ? "Expand group"
                          : "Collapse group"
                      }
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-xl font-black text-slate-300 transition hover:border-cyan-500/50 hover:text-cyan-300"
                    >
                      {isCollapsed ? "+" : "−"}
                    </button>

                    <div className="min-w-0 flex-1">
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
                        {group.items.length} {group.items.length === 1 ? "setting" : "settings"}
                        {isCollapsed ? " · collapsed" : " · expanded"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <MiniButton
                        label="↑"
                        title="Move group up"
                        onClick={() =>
                          moveGroup(groupIndex, "up")
                        }
                        disabled={groupIndex === 0}
                      />
                      <MiniButton
                        label="↓"
                        title="Move group down"
                        onClick={() =>
                          moveGroup(groupIndex, "down")
                        }
                        disabled={
                          groupIndex === groups.length - 1
                        }
                      />
                      <MiniButton
                        label="Duplicate"
                        title="Duplicate group"
                        onClick={() =>
                          duplicateGroup(groupIndex)
                        }
                      />
                      <MiniButton
                        label="+ Setting"
                        title="Add setting"
                        onClick={() => addItem(group.id)}
                        tone="cyan"
                      />
                      <MiniButton
                        label="Delete"
                        title="Delete group"
                        onClick={() =>
                          removeGroup(group.id)
                        }
                        tone="red"
                      />
                    </div>
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
                      <div className="space-y-4 border-t border-slate-800 p-4 sm:p-5">
                        {group.items.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-slate-700 p-5 text-center">
                            <p className="text-sm font-bold text-slate-400">
                              This group has no settings.
                            </p>
                            <button
                              type="button"
                              onClick={() => addItem(group.id)}
                              className="mt-3 text-sm font-black text-cyan-400 transition hover:text-white"
                            >
                              Add the first setting →
                            </button>
                          </div>
                        ) : (
                          group.items.map(
                            (item, itemIndex) => (
                              <div
                                key={item.id}
                                className="rounded-2xl border border-slate-800 bg-slate-900 p-4"
                              >
                                <div className="grid gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,0.72fr)_minmax(0,1.45fr)]">
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
                                      Recommended value
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
                                      Explanation / impact note
                                    </label>
                                    <textarea
                                      id={`note-${item.id}`}
                                      rows={3}
                                      value={item.note}
                                      onChange={(event) =>
                                        updateItem(
                                          group.id,
                                          item.id,
                                          "note",
                                          event.target.value,
                                        )
                                      }
                                      placeholder="Default: Ultra | Problem: GPU load | Why: ... | FPS: +4 | Visual: Low | Restart: No"
                                      className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                                    />
                                  </div>
                                </div>

                                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.05] pt-3">
                                  <p className="text-xs text-slate-600">
                                    {item.label.trim() && item.value.trim()
                                      ? "Complete setting"
                                      : "Label and value are required to save this setting"}
                                  </p>

                                  <div className="flex flex-wrap gap-2">
                                    <MiniButton
                                      label="↑"
                                      title="Move setting up"
                                      onClick={() =>
                                        moveItem(
                                          group.id,
                                          itemIndex,
                                          "up",
                                        )
                                      }
                                      disabled={itemIndex === 0}
                                    />
                                    <MiniButton
                                      label="↓"
                                      title="Move setting down"
                                      onClick={() =>
                                        moveItem(
                                          group.id,
                                          itemIndex,
                                          "down",
                                        )
                                      }
                                      disabled={
                                        itemIndex ===
                                        group.items.length - 1
                                      }
                                    />
                                    <MiniButton
                                      label="Duplicate"
                                      title="Duplicate setting"
                                      onClick={() =>
                                        duplicateItem(
                                          group.id,
                                          itemIndex,
                                        )
                                      }
                                    />
                                    <MiniButton
                                      label="Delete"
                                      title="Delete setting"
                                      onClick={() =>
                                        removeItem(
                                          group.id,
                                          item.id,
                                        )
                                      }
                                      tone="red"
                                    />
                                  </div>
                                </div>
                              </div>
                            ),
                          )
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

      <div className="sticky bottom-4 z-20 mt-8 flex flex-col gap-4 rounded-2xl border border-white/[0.1] bg-slate-950/95 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.55)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p
            className={`text-sm font-black ${
              isDirty
                ? "text-orange-300"
                : "text-green-300"
            }`}
          >
            {isDirty
              ? "Unsaved changes"
              : mode === "create"
                ? "Ready for a new preset"
                : "All loaded changes are saved"}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            {mode === "create"
              ? "After creation, the editor opens the saved preset in edit mode."
              : "Saving reloads this editor with the confirmed database values."}
          </p>
        </div>

        <SubmitButton
          mode={mode}
          disabled={
            games.length === 0 ||
            handhelds.length === 0
          }
        />
      </div>
    </form>
  );
}

function SubmitButton({
  mode,
  disabled,
}: {
  mode: "create" | "edit";
  disabled: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="min-w-48 rounded-xl bg-cyan-500 px-7 py-4 font-black text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-45"
    >
      {pending
        ? "Saving preset…"
        : mode === "create"
          ? "Create and continue editing"
          : "Save preset changes"}
    </button>
  );
}

function TextField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  min,
  max,
  step,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number";
  required?: boolean;
  min?: string;
  max?: string;
  step?: string;
}) {
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
        onChange={(event) =>
          onChange(event.target.value)
        }
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

function SelectField({
  label,
  name,
  options,
  placeholder,
  required = false,
  value,
  onChange,
}: {
  label: string;
  name: string;
  options: PresetEditorSelectOption[];
  placeholder: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
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
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
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

function SelectControl({
  label,
  name,
  value,
  onChange,
  options,
  optionLabels,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  optionLabels?: Record<string, string>;
}) {
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
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabels?.[option] ?? option}
          </option>
        ))}
      </select>
    </div>
  );
}

function MiniButton({
  label,
  title,
  onClick,
  disabled = false,
  tone = "neutral",
}: {
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "neutral" | "cyan" | "red";
}) {
  const toneClass =
    tone === "cyan"
      ? "border-cyan-500/35 bg-cyan-500/[0.08] text-cyan-300 hover:bg-cyan-500 hover:text-slate-950"
      : tone === "red"
        ? "border-red-500/35 bg-red-500/[0.08] text-red-300 hover:bg-red-500 hover:text-white"
        : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:text-white";

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border px-3 py-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-30 ${toneClass}`}
    >
      {label}
    </button>
  );
}
