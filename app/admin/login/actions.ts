"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

export async function loginAdmin(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(
      "/admin/login?error=Enter%20your%20email%20and%20password",
    );
  }

  const supabase = await createClient();

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error || !data.user) {
    redirect(
      "/admin/login?error=Invalid%20email%20or%20password",
    );
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", data.user.id)
      .single();

  if (profileError || !profile?.is_admin) {
    await supabase.auth.signOut();

    redirect(
      "/admin/login?error=This%20account%20is%20not%20an%20administrator",
    );
  }

  redirect("/admin");
}