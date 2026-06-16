"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  MODERATION_ROLES,
} from "../../../lib/auth/roles";
import { requireRole } from "../../../lib/auth/require-role";

function requiredText(
  formData: FormData,
  name: string,
) {
  return String(
    formData.get(name) ?? "",
  ).trim();
}

export async function removePresetConfirmation(
  formData: FormData,
) {
  const {
    supabase,
  } = await requireRole(
    MODERATION_ROLES,
    "/",
  );

  const confirmationId = requiredText(
    formData,
    "confirmationId",
  );

  const reason = requiredText(
    formData,
    "reason",
  );

  if (!confirmationId) {
    redirect(
      "/admin/preset-feedback?error=Missing%20confirmation%20ID",
    );
  }

  if (reason.length < 5) {
    redirect(
      "/admin/preset-feedback?error=Choose%20a%20clear%20moderation%20reason",
    );
  }

  const {
    data: presetId,
    error,
  } = await supabase.rpc(
    "moderate_preset_confirmation",
    {
      p_confirmation_id:
        confirmationId,
      p_reason: reason,
    },
  );

  if (error) {
    redirect(
      `/admin/preset-feedback?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidatePath(
    "/admin/preset-feedback",
  );
  revalidatePath("/presets");

  if (
    typeof presetId === "string" &&
    presetId.length > 0
  ) {
    revalidatePath(
      `/presets/${presetId}`,
    );
  }

  revalidatePath("/");

  redirect(
    "/admin/preset-feedback?success=Confirmation%20removed%20and%20logged",
  );
}
