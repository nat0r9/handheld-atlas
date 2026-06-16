"use client";

import { useState } from "react";
import PresetConfirmationButton from "./PresetConfirmationButton";

interface PresetDetailConfirmationProps {
  presetId: string;
  initialCount: number;
  initialHasConfirmed: boolean;
}

export default function PresetDetailConfirmation({
  presetId,
  initialCount,
  initialHasConfirmed,
}: PresetDetailConfirmationProps) {
  const [count, setCount] = useState(initialCount);
  const [hasConfirmed, setHasConfirmed] = useState(initialHasConfirmed);

  function handleConfirmationChange(
    _presetId: string,
    nextCount: number,
    nextHasConfirmed: boolean,
  ) {
    setCount(nextCount);
    setHasConfirmed(nextHasConfirmed);
  }

  return (
    <PresetConfirmationButton
      presetId={presetId}
      initialCount={initialCount}
      initialHasConfirmed={initialHasConfirmed}
      count={count}
      hasConfirmed={hasConfirmed}
      onConfirmationChange={handleConfirmationChange}
    />
  );
}
