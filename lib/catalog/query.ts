export type SearchParams = Record<string, string | string[] | undefined>;
export const PAGE_SIZE = 24;
export function param(params: SearchParams, key: string) {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}
export function pageNumber(value: string, total: number) {
  const parsed = /^\d+$/.test(value) ? Number(value) : 1;
  return Math.min(
    Math.max(1, Math.ceil(total / PAGE_SIZE)),
    Math.max(1, Number.isSafeInteger(parsed) ? parsed : 1),
  );
}
export function catalogUrl(
  path: string,
  values: Record<string, string | number | undefined>,
) {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "All")
      query.set(key, String(value));
  });
  return `${path}${query.size ? `?${query}` : ""}`;
}
export function genres(value: string) {
  return value
    .split(",")
    .map((part) =>
      part.trim().replace(/\b\w/g, (letter) => letter.toUpperCase()),
    )
    .filter(Boolean);
}
export function powerWatts(value: string | null) {
  // Only group an explicitly reported leading wattage. Never infer a mode's power.
  return value?.match(/^(\d+(?:\.\d+)?)\s*W\b/i)?.[1] ?? "";
}
export function powerSupply(value: string | null) {
  if (/wall power|charger connected/i.test(value ?? "")) return "plugged";
  if (/battery/i.test(value ?? "")) return "battery";
  return "unknown";
}
