"use client";
import { usePathname, useSearchParams } from "next/navigation";
export function useUrlValue<T extends string>(
  key: string,
  fallback: T,
): [T, (value: T) => void] {
  const pathname = usePathname();
  const params = useSearchParams();
  const value = (params.get(key) || fallback) as T;
  const update = (next: T) => {
    const query = new URLSearchParams(window.location.search);
    if (next === fallback || !next) query.delete(key);
    else query.set(key, next);
    query.delete("page");
    window.history.replaceState(
      null,
      "",
      `${pathname}${query.size ? `?${query}` : ""}`,
    );
  };
  return [value, update];
}
