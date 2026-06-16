"use client";

import { useTransition } from "react";
import { togglePresetConfirmation } from "../app/presets/actions";

interface PresetConfirmationButtonProps {
  presetId: string;
  initialCount: number;
  initialHasConfirmed: boolean;
  count: number;
  hasConfirmed: boolean;
  onConfirmationChange: (
    presetId: string,
    count: number,
    hasConfirmed: boolean,
  ) => void;
  compact?: boolean;
}

export default function PresetConfirmationButton({
  presetId,
  initialCount,
  initialHasConfirmed,
  count,
  hasConfirmed,
  onConfirmationChange,
  compact = false,
}: PresetConfirmationButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleConfirmation() {
    const optimisticHasConfirmed = !hasConfirmed;
    const optimisticCount = Math.max(
      0,
      count + (optimisticHasConfirmed ? 1 : -1),
    );

    onConfirmationChange(
      presetId,
      optimisticCount,
      optimisticHasConfirmed,
    );

    startTransition(async () => {
      try {
        const result = await togglePresetConfirmation(presetId);

        onConfirmationChange(
          presetId,
          result.confirmationCount,
          result.hasConfirmed,
        );
      } catch (error) {
        onConfirmationChange(
          presetId,
          initialCount,
          initialHasConfirmed,
        );

        console.error("Could not update preset confirmation:", error);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleConfirmation}
      disabled={isPending}
      aria-pressed={hasConfirmed}
      title="Confirm that this preset worked on the listed handheld and target settings."
      className={`flex items-center justify-center gap-2 rounded-xl border font-black transition disabled:cursor-wait disabled:opacity-70 ${
        compact
          ? "min-w-[7.25rem] px-3 py-2.5 text-sm"
          : "w-full px-4 py-3 text-sm"
      } ${
        hasConfirmed
          ? "border-green-500/45 bg-green-500/15 text-green-300 shadow-[0_0_18px_rgba(34,197,94,0.1)]"
          : "border-white/[0.08] bg-black/20 text-slate-400 hover:border-green-500/35 hover:text-green-300"
      }`}
    >
      <span aria-hidden="true" className="text-base">
        ✓
      </span>

      <span>
        {isPending
          ? "Saving"
          : hasConfirmed
            ? "Confirmed"
            : "Worked for me"}
      </span>

      <span
        className={`rounded-md px-1.5 py-0.5 text-xs ${
          hasConfirmed
            ? "bg-green-500/15 text-green-200"
            : "bg-white/[0.05] text-slate-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
