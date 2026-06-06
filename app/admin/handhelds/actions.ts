"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (error || !profile?.is_admin) {
    redirect("/admin/login");
  }

  return {
    supabase,
    user,
  };
}

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function requiredText(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function optionalText(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();

  return value.length > 0 ? value : null;
}

function getContentStatus(formData: FormData) {
  const value = String(formData.get("status") ?? "draft");

  if (
    value === "published" ||
    value === "archived" ||
    value === "draft"
  ) {
    return value;
  }

  return "draft";
}

export async function createHandheld(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const name = requiredText(formData, "name");
  const manualSlug = requiredText(formData, "slug");
  const manufacturer = requiredText(formData, "manufacturer");
  const deviceStatus =
    requiredText(formData, "deviceStatus") || "Current";
  const status = getContentStatus(formData);

  if (!name || !manufacturer) {
    redirect(
      "/admin/handhelds?error=Handheld%20name%20and%20manufacturer%20are%20required",
    );
  }

  const slug = createSlug(manualSlug || name);

  if (!slug) {
    redirect(
      "/admin/handhelds?error=Could%20not%20create%20a%20valid%20slug",
    );
  }

  const { error } = await supabase.from("handhelds").insert({
    name,
    slug,
    manufacturer,
    device_status: deviceStatus,
    operating_system: optionalText(
      formData,
      "operatingSystem",
    ),
    processor: optionalText(formData, "processor"),
    memory: optionalText(formData, "memory"),
    storage: optionalText(formData, "storage"),
    display_size: optionalText(formData, "displaySize"),
    resolution: optionalText(formData, "resolution"),
    refresh_rate: optionalText(formData, "refreshRate"),
    battery: optionalText(formData, "battery"),
    weight: optionalText(formData, "weight"),
    image_url: optionalText(formData, "imageUrl"),
    tagline: optionalText(formData, "tagline"),
    status,
    created_by: user.id,
    published_at:
      status === "published" ? new Date().toISOString() : null,
  });

  if (error) {
    redirect(
      `/admin/handhelds?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/handhelds");
  revalidatePath("/handhelds");
  revalidatePath("/compare");

  redirect(
    "/admin/handhelds?success=Handheld%20created",
  );
}

export async function updateHandheld(formData: FormData) {
  const { supabase } = await requireAdmin();

  const handheldId = requiredText(formData, "handheldId");
  const name = requiredText(formData, "name");
  const manualSlug = requiredText(formData, "slug");
  const manufacturer = requiredText(formData, "manufacturer");
  const deviceStatus =
    requiredText(formData, "deviceStatus") || "Current";
  const status = getContentStatus(formData);

  if (!handheldId) {
    redirect(
      "/admin/handhelds?error=Missing%20handheld%20ID",
    );
  }

  if (!name || !manufacturer) {
    redirect(
      `/admin/handhelds/${handheldId}/edit?error=Handheld%20name%20and%20manufacturer%20are%20required`,
    );
  }

  const slug = createSlug(manualSlug || name);

  if (!slug) {
    redirect(
      `/admin/handhelds/${handheldId}/edit?error=Could%20not%20create%20a%20valid%20slug`,
    );
  }

  const { data: currentHandheld, error: currentError } =
    await supabase
      .from("handhelds")
      .select("status, published_at")
      .eq("id", handheldId)
      .single();

  if (currentError || !currentHandheld) {
    redirect(
      `/admin/handhelds/${handheldId}/edit?error=Handheld%20not%20found`,
    );
  }

  const publishedAt =
    status === "published"
      ? currentHandheld.published_at ??
        new Date().toISOString()
      : null;

  const { error } = await supabase
    .from("handhelds")
    .update({
      name,
      slug,
      manufacturer,
      device_status: deviceStatus,
      operating_system: optionalText(
        formData,
        "operatingSystem",
      ),
      processor: optionalText(formData, "processor"),
      memory: optionalText(formData, "memory"),
      storage: optionalText(formData, "storage"),
      display_size: optionalText(formData, "displaySize"),
      resolution: optionalText(formData, "resolution"),
      refresh_rate: optionalText(formData, "refreshRate"),
      battery: optionalText(formData, "battery"),
      weight: optionalText(formData, "weight"),
      image_url: optionalText(formData, "imageUrl"),
      tagline: optionalText(formData, "tagline"),
      status,
      published_at: publishedAt,
    })
    .eq("id", handheldId);

  if (error) {
    redirect(
      `/admin/handhelds/${handheldId}/edit?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/handhelds");
  revalidatePath(
    `/admin/handhelds/${handheldId}/edit`,
  );
  revalidatePath("/handhelds");
  revalidatePath(`/handhelds/${slug}`);
  revalidatePath("/compare");

  redirect(
    `/admin/handhelds/${handheldId}/edit?success=Handheld%20updated`,
  );
}

export async function deleteHandheld(formData: FormData) {
  const { supabase } = await requireAdmin();

  const handheldId = requiredText(formData, "handheldId");

  if (!handheldId) {
    redirect(
      "/admin/handhelds?error=Missing%20handheld%20ID",
    );
  }

  const { error } = await supabase
    .from("handhelds")
    .delete()
    .eq("id", handheldId);

  if (error) {
    redirect(
      `/admin/handhelds?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/handhelds");
  revalidatePath("/handhelds");
  revalidatePath("/compare");

  redirect(
    "/admin/handhelds?success=Handheld%20deleted",
  );
}