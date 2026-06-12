export const APP_ROLES = [
  "user",
  "benchmark_tester",
  "moderator",
  "atlas_editor",
  "admin",
] as const;

export type AppRole =
  (typeof APP_ROLES)[number];

export const STAFF_ROLES: AppRole[] = [
  "benchmark_tester",
  "moderator",
  "atlas_editor",
  "admin",
];

export const MODERATION_ROLES: AppRole[] = [
  "moderator",
  "atlas_editor",
  "admin",
];

export const CONTENT_EDITOR_ROLES: AppRole[] = [
  "atlas_editor",
  "admin",
];

export const BENCHMARK_EDITOR_ROLES: AppRole[] = [
  "benchmark_tester",
  "atlas_editor",
  "admin",
];

export const PRESET_EDITOR_ROLES: AppRole[] = [
  "benchmark_tester",
  "atlas_editor",
  "admin",
];

export function isAppRole(
  value: unknown,
): value is AppRole {
  return (
    typeof value === "string" &&
    APP_ROLES.includes(
      value as AppRole,
    )
  );
}

export function normalizeRole(
  value: unknown,
  legacyIsAdmin = false,
): AppRole {
  if (isAppRole(value)) {
    return value;
  }

  return legacyIsAdmin
    ? "admin"
    : "user";
}

export function hasAnyRole(
  role: AppRole,
  allowedRoles: readonly AppRole[],
) {
  return allowedRoles.includes(role);
}

export function getRoleLabel(
  role: AppRole,
) {
  switch (role) {
    case "benchmark_tester":
      return "Benchmark Tester";
    case "moderator":
      return "Moderator";
    case "atlas_editor":
      return "Atlas Editor";
    case "admin":
      return "Administrator";
    default:
      return "Member";
  }
}

export function getStaffHome(
  role: AppRole,
) {
  if (role === "benchmark_tester") {
    return "/admin/tester";
  }

  if (role === "moderator") {
    return "/admin/submissions";
  }

  if (
    role === "atlas_editor" ||
    role === "admin"
  ) {
    return "/admin";
  }

  return null;
}
