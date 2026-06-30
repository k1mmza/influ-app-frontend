import type { Role } from "@/lib/types";

/** Deterministic generated avatar (DiceBear) used ONLY as a fallback when the
 *  user has no uploaded avatar. Accepts a null role (pre-role-select). */
export function getAvatarUrl(name: string, role: Role | null | undefined): string {
  const seed = encodeURIComponent(name.trim() || "user");
  const style = role === "influencer" ? "thumbs" : "shapes";
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}`;
}
