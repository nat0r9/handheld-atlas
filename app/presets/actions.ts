"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

export interface PresetVoteResult {
  hasUpvoted: boolean;
  upvoteCount: number;
}

export async function togglePresetVote(
  presetId: string,
): Promise<PresetVoteResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data: preset,
    error: presetError,
  } = await supabase
    .from("presets")
    .select("id, status")
    .eq("id", presetId)
    .maybeSingle();

  if (
    presetError ||
    !preset ||
    preset.status !== "published"
  ) {
    throw new Error(
      presetError?.message ??
        "This preset is not available for voting.",
    );
  }

  const {
    data: existingVote,
    error: voteLookupError,
  } = await supabase
    .from("preset_votes")
    .select("id")
    .eq("preset_id", presetId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (voteLookupError) {
    throw new Error(voteLookupError.message);
  }

  let hasUpvoted: boolean;

  if (existingVote) {
    const { error: deleteError } =
      await supabase
        .from("preset_votes")
        .delete()
        .eq("id", existingVote.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    hasUpvoted = false;
  } else {
    const { error: insertError } =
      await supabase
        .from("preset_votes")
        .insert({
          preset_id: presetId,
          user_id: user.id,
        });

    if (insertError) {
      throw new Error(insertError.message);
    }

    hasUpvoted = true;
  }

  const {
    count,
    error: countError,
  } = await supabase
    .from("preset_votes")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("preset_id", presetId);

  if (countError) {
    throw new Error(countError.message);
  }

  revalidatePath("/presets");
  revalidatePath("/");

  return {
    hasUpvoted,
    upvoteCount: count ?? 0,
  };
}
