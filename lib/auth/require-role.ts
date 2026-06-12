"server-only";

import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
import {
  type AppRole,
  hasAnyRole,
  normalizeRole,
} from "./roles";

export async function getCurrentRole() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
      role: "user" as AppRole,
    };
  }

  const {
    data: profile,
    error,
  } = await supabase
    .from("profiles")
    .select("role, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error(
      "Could not load user role:",
      error.message,
    );
  }

  return {
    supabase,
    user,
    role: normalizeRole(
      profile?.role,
      profile?.is_admin ?? false,
    ),
  };
}

export async function requireRole(
  allowedRoles: readonly AppRole[],
  redirectTo = "/",
) {
  const {
    supabase,
    user,
    role,
  } = await getCurrentRole();

  if (!user) {
    redirect("/admin/login");
  }

  if (
    !hasAnyRole(
      role,
      allowedRoles,
    )
  ) {
    redirect(redirectTo);
  }

  return {
    supabase,
    user,
    role,
  };
}
