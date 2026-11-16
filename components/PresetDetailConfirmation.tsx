"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";
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
  useEffect(() => {
    let active = true;
    const supabase = createClient();
    async function loadOwnConfirmation() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active || !user) return;
      const { data, error } = await supabase.from("preset_confirmations")
        .select("id")
        .eq("preset_id", presetId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (active && !error) setHasConfirmed(Boolean(data));
    }
    void loadOwnConfirmation();
    return () => { active = false; };
  }, [presetId]);

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
      initialCount={count}
      initialHasConfirmed={hasConfirmed}
      count={count}
      hasConfirmed={hasConfirmed}
      onConfirmationChange={handleConfirmationChange}
    />
  );
}
