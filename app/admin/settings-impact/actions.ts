"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CONTENT_EDITOR_ROLES } from "../../../lib/auth/roles";
import { requireRole } from "../../../lib/auth/require-role";

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function optionalText(formData: FormData, name: string) {
  const value = text(formData, name);
  return value || null;
}

function checkbox(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function impactValue(formData: FormData, name: string) {
  const value = Number(text(formData, name));
  return Number.isFinite(value) ? Math.min(5, Math.max(0, Math.round(value))) : 0;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function normalizeAlias(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function parseAliases(value: string, name: string) {
  const unique = new Map<string, string>();

  for (const alias of [name, ...value.split(/[,\n]/)]) {
    const clean = alias.trim();
    const normalized = normalizeAlias(clean);

    if (clean && normalized && !unique.has(normalized)) {
      unique.set(normalized, clean);
    }
  }

  return Array.from(unique, ([normalized_alias, alias]) => ({ alias, normalized_alias }));
}

function getPayload(formData: FormData) {
  const name = text(formData, "name");
  const summary = text(formData, "summary");
  const slug = slugify(text(formData, "slug") || name);
  const category = text(formData, "category") || "Other";
  const commonness = text(formData, "commonness");
  const status = text(formData, "status");

  if (!name || !summary || !slug) {
    redirect("/admin/settings-impact?error=Name%2C%20summary%20and%20slug%20are%20required");
  }

  return {
    entry: {
      name,
      slug,
      category,
      commonness: ["common", "advanced", "specialized"].includes(commonness)
        ? commonness
        : "common",
      summary,
      description: optionalText(formData, "description"),
      performance_impact: impactValue(formData, "performanceImpact"),
      visual_impact: impactValue(formData, "visualImpact"),
      vram_impact: impactValue(formData, "vramImpact"),
      cpu_impact: impactValue(formData, "cpuImpact"),
      latency_impact: impactValue(formData, "latencyImpact"),
      restart_required: checkbox(formData, "restartRequired"),
      when_to_lower: optionalText(formData, "whenToLower"),
      when_to_keep_high: optionalText(formData, "whenToKeepHigh"),
      handheld_advice: optionalText(formData, "handheldAdvice"),
      caveat: optionalText(formData, "caveat"),
      confidence: Math.max(1, impactValue(formData, "confidence")),
      atlas_verified: checkbox(formData, "atlasVerified"),
      status: ["draft", "published", "archived"].includes(status) ? status : "draft",
    },
    aliases: parseAliases(text(formData, "aliases"), name),
  };
}

function refreshSettingsImpact(slug?: string) {
  revalidatePath("/settings-impact");
  revalidatePath("/presets");
  revalidatePath("/search");
  if (slug) {
    revalidatePath(`/settings-impact/${slug}`);
  }
}

export async function createSettingImpact(formData: FormData) {
  const { supabase, user } = await requireRole(CONTENT_EDITOR_ROLES, "/");
  const payload = getPayload(formData);
  const { data, error } = await supabase
    .from("setting_impact_entries")
    .insert({ ...payload.entry, created_by: user.id })
    .select("id, slug")
    .single();

  if (error || !data) {
    redirect(`/admin/settings-impact?error=${encodeURIComponent(error?.message ?? "Could not create setting")}`);
  }

  const { error: aliasError } = await supabase.rpc(
    "replace_setting_impact_aliases",
    {
      p_setting_impact_id: data.id,
      p_aliases: payload.aliases,
    },
  );

  if (aliasError) {
    await supabase.from("setting_impact_entries").delete().eq("id", data.id);
    redirect(`/admin/settings-impact?error=${encodeURIComponent(aliasError.message)}`);
  }

  refreshSettingsImpact(data.slug);
  redirect(`/admin/settings-impact/${data.id}/edit?success=Setting%20created`);
}

export async function updateSettingImpact(id: string, formData: FormData) {
  const { supabase } = await requireRole(CONTENT_EDITOR_ROLES, "/");
  const payload = getPayload(formData);
  const { error } = await supabase
    .from("setting_impact_entries")
    .update(payload.entry)
    .eq("id", id);

  if (error) {
    redirect(`/admin/settings-impact/${id}/edit?error=${encodeURIComponent(error.message)}`);
  }

  const { error: aliasError } = await supabase.rpc(
    "replace_setting_impact_aliases",
    {
      p_setting_impact_id: id,
      p_aliases: payload.aliases,
    },
  );

  if (aliasError) {
    redirect(`/admin/settings-impact/${id}/edit?error=${encodeURIComponent(aliasError.message)}`);
  }

  refreshSettingsImpact(payload.entry.slug);
  redirect(`/admin/settings-impact/${id}/edit?success=Changes%20saved`);
}

export async function deleteSettingImpact(id: string) {
  const { supabase } = await requireRole(CONTENT_EDITOR_ROLES, "/");
  const { error } = await supabase.from("setting_impact_entries").delete().eq("id", id);

  if (error) {
    redirect(`/admin/settings-impact?error=${encodeURIComponent(error.message)}`);
  }

  refreshSettingsImpact();
  redirect("/admin/settings-impact?success=Setting%20deleted");
}

export async function addGameSettingImpact(settingImpactId: string, formData: FormData) {
  const { supabase, user } = await requireRole(CONTENT_EDITOR_ROLES, "/");
  const gameId = text(formData, "gameId");

  if (!gameId) {
    redirect(`/admin/settings-impact/${settingImpactId}/edit?error=Choose%20a%20game`);
  }

  const { error } = await supabase.from("game_setting_impacts").insert({
    setting_impact_id: settingImpactId,
    game_id: gameId,
    handheld_id: optionalText(formData, "handheldId"),
    recommended_value: optionalText(formData, "recommendedValue"),
    performance_change: optionalText(formData, "performanceChange"),
    visual_note: optionalText(formData, "visualNote"),
    resolution: optionalText(formData, "resolution"),
    tdp: optionalText(formData, "tdp"),
    test_note: optionalText(formData, "testNote"),
    source_url: optionalText(formData, "sourceUrl"),
    confidence: Math.max(1, impactValue(formData, "evidenceConfidence")),
    atlas_verified: checkbox(formData, "evidenceVerified"),
    status: "published",
    created_by: user.id,
  });

  if (error) {
    redirect(`/admin/settings-impact/${settingImpactId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  refreshSettingsImpact();
  redirect(`/admin/settings-impact/${settingImpactId}/edit?success=Game-specific%20evidence%20added`);
}

export async function deleteGameSettingImpact(settingImpactId: string, evidenceId: string) {
  const { supabase } = await requireRole(CONTENT_EDITOR_ROLES, "/");
  const { error } = await supabase.from("game_setting_impacts").delete().eq("id", evidenceId);

  if (error) {
    redirect(`/admin/settings-impact/${settingImpactId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  refreshSettingsImpact();
  redirect(`/admin/settings-impact/${settingImpactId}/edit?success=Evidence%20removed`);
}
