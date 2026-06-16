"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

export interface PresetVoteResult {
  hasUpvoted: boolean;
  upvoteCount: number;
}

export interface PresetConfirmationResult {
  hasConfirmed: boolean;
  confirmationCount: number;
}

async function requirePublishedPreset(presetId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: preset, error: presetError } = await supabase
    .from("presets")
    .select("id, status")
    .eq("id", presetId)
    .maybeSingle();

  if (presetError || !preset || preset.status !== "published") {
    throw new Error(
      presetError?.message ?? "This preset is not publicly available.",
    );
  }

  return {
    supabase,
    user,
  };
}

export async function togglePresetVote(
  presetId: string,
): Promise<PresetVoteResult> {
  const { supabase, user } = await requirePublishedPreset(presetId);

  const { data: existingVote, error: voteLookupError } = await supabase
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
    const { error: deleteError } = await supabase
      .from("preset_votes")
      .delete()
      .eq("id", existingVote.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    hasUpvoted = false;
  } else {
    const { error: insertError } = await supabase
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

  const { count, error: countError } = await supabase
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
  revalidatePath(`/presets/${presetId}`);
  revalidatePath("/");

  return {
    hasUpvoted,
    upvoteCount: count ?? 0,
  };
}

export async function togglePresetConfirmation(
  presetId: string,
): Promise<PresetConfirmationResult> {
  const { supabase, user } = await requirePublishedPreset(presetId);

  const { data: existingConfirmation, error: lookupError } = await supabase
    .from("preset_confirmations")
    .select("id")
    .eq("preset_id", presetId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  let hasConfirmed: boolean;

  if (existingConfirmation) {
    const { error: deleteError } = await supabase
      .from("preset_confirmations")
      .delete()
      .eq("id", existingConfirmation.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    hasConfirmed = false;
  } else {
    const { error: insertError } = await supabase
      .from("preset_confirmations")
      .insert({
        preset_id: presetId,
        user_id: user.id,
      });

    if (insertError) {
      throw new Error(insertError.message);
    }

    hasConfirmed = true;
  }

  const { count, error: countError } = await supabase
    .from("preset_confirmations")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("preset_id", presetId);

  if (countError) {
    throw new Error(countError.message);
  }

  revalidatePath("/presets");
  revalidatePath(`/presets/${presetId}`);

  return {
    hasConfirmed,
    confirmationCount: count ?? 0,
  };
}
