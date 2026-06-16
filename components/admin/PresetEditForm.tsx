"use client";

import PresetEditorForm, {
  type PresetEditorSelectOption,
  type PresetEditorSettingGroup,
  type PresetEditorSettingItem,
  type PresetEditorType,
} from "./PresetEditorForm";

export type PresetEditSelectOption =
  PresetEditorSelectOption;

export type PresetEditSettingItem =
  PresetEditorSettingItem;

export type PresetEditSettingGroup =
  PresetEditorSettingGroup;

export interface EditablePreset {
  id: string;
  gameId: string;
  handheldId: string;
  name: string;
  presetType: PresetEditorType;
  resolution: string;
  tdp: string;
  fpsAverage: string;
  onePercentLow: string;
  upscaler: string;
  batteryLife: string;
  communityRating: string;
  summary: string;
  status: "draft" | "published" | "archived";
  atlasVerified: boolean;
  groups: PresetEditSettingGroup[];
}

interface PresetEditFormProps {
  preset: EditablePreset;
  games: PresetEditSelectOption[];
  handhelds: PresetEditSelectOption[];
  action: (formData: FormData) => Promise<void>;
  canSetAtlasVerified?: boolean;
  lockToDraft?: boolean;
  clearLocalDraftOnLoad?: boolean;
}

export default function PresetEditForm({
  preset,
  games,
  handhelds,
  action,
  canSetAtlasVerified = false,
  lockToDraft = false,
  clearLocalDraftOnLoad = false,
}: PresetEditFormProps) {
  return (
    <PresetEditorForm
      mode="edit"
      presetId={preset.id}
      games={games}
      handhelds={handhelds}
      action={action}
      initialValues={{
        gameId: preset.gameId,
        handheldId: preset.handheldId,
        presetType: preset.presetType,
        name: preset.name,
        resolution: preset.resolution,
        tdp: preset.tdp,
        fpsAverage: preset.fpsAverage,
        onePercentLow: preset.onePercentLow,
        upscaler: preset.upscaler,
        batteryLife: preset.batteryLife,
        communityRating:
          preset.communityRating,
        summary: preset.summary,
        status: preset.status,
        atlasVerified:
          preset.atlasVerified,
      }}
      initialGroups={preset.groups}
      canSetAtlasVerified={canSetAtlasVerified}
      lockToDraft={lockToDraft}
      clearLocalDraftOnLoad={clearLocalDraftOnLoad}
    />
  );
}
