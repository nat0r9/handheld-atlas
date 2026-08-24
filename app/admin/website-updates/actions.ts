"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CONTENT_EDITOR_ROLES } from "../../../lib/auth/roles";
import { requireRole } from "../../../lib/auth/require-role";

function requiredText(
  formData: FormData,
  name: string,
) {
  return String(
    formData.get(name) ?? "",
  ).trim();
}

function normalizeWebsiteUrl(
  value: string,
) {
  if (!value) {
    return null;
  }

  if (
    value.startsWith("/") &&
    !value.startsWith("//")
  ) {
    return value;
  }

  try {
    const url = new URL(value);
    const hostname =
      url.hostname.toLowerCase();

    if (
      url.protocol !== "https:" ||
      (hostname !== "handheldatlas.com" &&
        hostname !==
          "www.handheldatlas.com")
    ) {
      return undefined;
    }

    return url.toString();
  } catch {
    return undefined;
  }
}

export async function publishWebsiteUpdate(
  formData: FormData,
) {
  const { supabase, user } =
    await requireRole(
      CONTENT_EDITOR_ROLES,
      "/",
    );

  const title = requiredText(
    formData,
    "title",
  );
  const summary = requiredText(
    formData,
    "summary",
  );
  const url = normalizeWebsiteUrl(
    requiredText(formData, "url"),
  );

  if (!title || !summary) {
    redirect(
      "/admin/website-updates?error=Title%20and%20summary%20are%20required",
    );
  }

  if (title.length > 256) {
    redirect(
      "/admin/website-updates?error=Title%20must%20be%20256%20characters%20or%20fewer",
    );
  }

  if (summary.length > 1500) {
    redirect(
      "/admin/website-updates?error=Summary%20must%20be%201500%20characters%20or%20fewer",
    );
  }

  if (url === undefined) {
    redirect(
      "/admin/website-updates?error=Use%20a%20HandheldAtlas%20path%20or%20HTTPS%20HandheldAtlas%20URL",
    );
  }

  const { error } = await supabase
    .from("website_updates")
    .insert({
      title,
      summary,
      url,
      created_by: user.id,
    });

  if (error) {
    redirect(
      `/admin/website-updates?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidatePath("/admin");
  revalidatePath(
    "/admin/website-updates",
  );

  redirect(
    "/admin/website-updates?success=Website%20update%20queued%20for%20Discord",
  );
}
