"use client";

import PresetEditorForm, {
  type PresetEditorSelectOption,
  type PresetEditorSettingGroup,
  type PresetEditorValues,
} from "./PresetEditorForm";

export type PresetSelectOption =
  PresetEditorSelectOption;

interface PresetCreateFormProps {
  games: PresetSelectOption[];
  handhelds: PresetSelectOption[];
  action: (formData: FormData) => Promise<void>;
  canSetAtlasVerified?: boolean;
  lockToDraft?: boolean;
}

const initialValues: PresetEditorValues = {
  gameId: "",
  handheldId: "",
  presetType: "Balanced",
  name: "",
  resolution: "",
  tdp: "",
  fpsAverage: "",
  onePercentLow: "",
  upscaler: "",
  batteryLife: "",
  communityRating: "",
  summary: "",
  status: "draft",
  atlasVerified: false,
};

const initialGroups: PresetEditorSettingGroup[] = [
  {
    id: "preset-create-initial-group",
    name: "",
    items: [
      {
        id: "preset-create-initial-setting",
        label: "",
        value: "",
        note: "",
      },
    ],
  },
];

export default function PresetCreateForm({
  games,
  handhelds,
  action,
  canSetAtlasVerified = false,
  lockToDraft = false,
}: PresetCreateFormProps) {
  return (
    <PresetEditorForm
      mode="create"
      games={games}
      handhelds={handhelds}
      action={action}
      initialValues={initialValues}
      initialGroups={initialGroups}
      canSetAtlasVerified={canSetAtlasVerified}
      lockToDraft={lockToDraft}
    />
  );
}
