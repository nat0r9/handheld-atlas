"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

function requiredText(
  formData: FormData,
  name: string,
) {
  return String(
    formData.get(name) ?? "",
  ).trim();
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function redirectWithError(
  path: string,
  message: string,
): never {
  redirect(
    `${path}?error=${encodeURIComponent(message)}`,
  );
}

function redirectWithSuccess(
  path: string,
  message: string,
): never {
  redirect(
    `${path}?success=${encodeURIComponent(message)}`,
  );
}

export async function registerUser(
  formData: FormData,
) {
  const displayName = requiredText(
    formData,
    "displayName",
  );

  const email = normalizeEmail(
    requiredText(formData, "email"),
  );

  const password = requiredText(
    formData,
    "password",
  );

  const confirmPassword = requiredText(
    formData,
    "confirmPassword",
  );

  if (
    !displayName ||
    !email ||
    !password ||
    !confirmPassword
  ) {
    redirectWithError(
      "/register",
      "Complete all required fields.",
    );
  }

  if (displayName.length < 2) {
    redirectWithError(
      "/register",
      "Display name must contain at least 2 characters.",
    );
  }

  if (displayName.length > 40) {
    redirectWithError(
      "/register",
      "Display name can contain at most 40 characters.",
    );
  }

  if (password.length < 8) {
    redirectWithError(
      "/register",
      "Password must contain at least 8 characters.",
    );
  }

  if (password !== confirmPassword) {
    redirectWithError(
      "/register",
      "Passwords do not match.",
    );
  }

  const supabase = await createClient();

  const {
    data,
    error,
  } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  });

  if (error) {
    redirectWithError(
      "/register",
      error.message,
    );
  }

  /*
   * When email confirmation is disabled, Supabase creates
   * the session immediately. Otherwise the user receives a
   * confirmation email and signs in afterwards.
   */
  if (data.session) {
    revalidatePath("/", "layout");
    redirectWithSuccess(
      "/profile",
      "Account created successfully.",
    );
  }

  redirectWithSuccess(
    "/login",
    "Account created. Check your email to confirm the account, then sign in.",
  );
}

export async function loginUser(
  formData: FormData,
) {
  const email = normalizeEmail(
    requiredText(formData, "email"),
  );

  const password = requiredText(
    formData,
    "password",
  );

  if (!email || !password) {
    redirectWithError(
      "/login",
      "Enter your email and password.",
    );
  }

  const supabase = await createClient();

  const {
    data,
    error,
  } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    redirectWithError(
      "/login",
      "Invalid email or password.",
    );
  }

  revalidatePath("/", "layout");
  redirect("/profile");
}

export async function logoutUser() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/");
}

export async function updateProfile(
  formData: FormData,
) {
  const displayName = requiredText(
    formData,
    "displayName",
  );

  if (displayName.length < 2) {
    redirectWithError(
      "/profile",
      "Display name must contain at least 2 characters.",
    );
  }

  if (displayName.length > 40) {
    redirectWithError(
      "/profile",
      "Display name can contain at most 40 characters.",
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    redirectWithError(
      "/profile",
      error.message,
    );
  }

  await supabase.auth.updateUser({
    data: {
      display_name: displayName,
    },
  });

  revalidatePath("/", "layout");
  revalidatePath("/profile");

  redirectWithSuccess(
    "/profile",
    "Profile updated successfully.",
  );
}
