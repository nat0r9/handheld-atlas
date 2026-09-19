import "server-only";
import { revalidatePath as nextRevalidatePath, updateTag } from "next/cache";
import { publicPathTags } from "./public-policy";

// Called only from the existing authenticated Server Actions, after successful
// writes. Expire shared data as well as the route, including joined records.
export function revalidatePath(path: string, type?: "page" | "layout") {
  for (const tag of publicPathTags(path)) updateTag(tag);
  nextRevalidatePath(path, type);
}
