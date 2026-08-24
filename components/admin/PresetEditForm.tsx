"use client";

import PresetEditorForm, {
  type PresetEditorSelectOption,
  type PresetEditorSettingGroup,
  type PresetEditorSettingItem,
  type PresetEditorType,
  type EvidenceArtifactType,
  type EvidenceTier,
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
  evidenceTier: EvidenceTier;
  sourceName: string;
  sourceUrl: string;
  sourceCheckedAt: string;
  gameVersion: string;
  driverVersion: string;
  osVersion: string;
  evidenceArtifactType: EvidenceArtifactType;
  evidenceArtifactUrl: string;
  evidenceExceptionApproved: boolean;
  evidenceExceptionReason: string;
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
        evidenceTier: preset.evidenceTier,
        sourceName: preset.sourceName,
        sourceUrl: preset.sourceUrl,
        sourceCheckedAt: preset.sourceCheckedAt,
        gameVersion: preset.gameVersion,
        driverVersion: preset.driverVersion,
        osVersion: preset.osVersion,
        evidenceArtifactType:
          preset.evidenceArtifactType,
        evidenceArtifactUrl:
          preset.evidenceArtifactUrl,
        evidenceExceptionApproved:
          preset.evidenceExceptionApproved,
        evidenceExceptionReason:
          preset.evidenceExceptionReason,
      }}
      initialGroups={preset.groups}
      canSetAtlasVerified={canSetAtlasVerified}
      lockToDraft={lockToDraft}
      clearLocalDraftOnLoad={clearLocalDraftOnLoad}
    />
  );
}
