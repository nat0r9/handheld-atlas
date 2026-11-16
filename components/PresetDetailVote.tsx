"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";
import PresetVoteButton from "./PresetVoteButton";

interface PresetDetailVoteProps {
  presetId: string;
  initialCount: number;
  initialHasUpvoted: boolean;
}

export default function PresetDetailVote({
  presetId,
  initialCount,
  initialHasUpvoted,
}: PresetDetailVoteProps) {
  const [count, setCount] = useState(initialCount);
  const [hasUpvoted, setHasUpvoted] = useState(initialHasUpvoted);
  useEffect(() => {
    let active = true;
    const supabase = createClient();
    async function loadOwnVote() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active || !user) return;
      const { data, error } = await supabase.from("preset_votes")
        .select("id")
        .eq("preset_id", presetId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (active && !error) setHasUpvoted(Boolean(data));
    }
    void loadOwnVote();
    return () => { active = false; };
  }, [presetId]);

  function handleVoteChange(
    _presetId: string,
    nextCount: number,
    nextHasUpvoted: boolean,
  ) {
    setCount(nextCount);
    setHasUpvoted(nextHasUpvoted);
  }

  return (
    <PresetVoteButton
      presetId={presetId}
      initialCount={count}
      initialHasUpvoted={hasUpvoted}
      count={count}
      hasUpvoted={hasUpvoted}
      onVoteChange={handleVoteChange}
    />
  );
}