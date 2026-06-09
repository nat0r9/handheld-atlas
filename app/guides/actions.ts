"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

export interface GuideVoteResult {
  hasUpvoted: boolean;
  upvoteCount: number;
}

export async function toggleGuideVote(
  guideId: string,
): Promise<GuideVoteResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data: guide,
    error: guideError,
  } = await supabase
    .from("guides")
    .select("id, slug, status")
    .eq("id", guideId)
    .maybeSingle();

  if (
    guideError ||
    !guide ||
    guide.status !== "published"
  ) {
    throw new Error(
      guideError?.message ??
        "This guide is not available for voting.",
    );
  }

  const {
    data: existingVote,
    error: lookupError,
  } = await supabase
    .from("guide_votes")
    .select("id")
    .eq("guide_id", guideId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  let hasUpvoted: boolean;

  if (existingVote) {
    const { error: deleteError } =
      await supabase
        .from("guide_votes")
        .delete()
        .eq("id", existingVote.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    hasUpvoted = false;
  } else {
    const { error: insertError } =
      await supabase
        .from("guide_votes")
        .insert({
          guide_id: guideId,
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
    .from("guide_votes")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("guide_id", guideId);

  if (countError) {
    throw new Error(countError.message);
  }

  revalidatePath("/guides");
  revalidatePath(`/guides/${guide.slug}`);
  revalidatePath("/");

  return {
    hasUpvoted,
    upvoteCount: count ?? 0,
  };
}
