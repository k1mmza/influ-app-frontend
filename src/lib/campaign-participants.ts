import type { Role } from "@/lib/types";

/** Stable display names for demo partners when the signed-in user replaces one role. */
export const DEMO_PARTNER_BY_ROLE: Record<Role, string> = {
  brand: "David Kim",
  agency: "Sarah Chen",
  influencer: "Lina Park",
  // Admin is never a campaign participant — present only to keep the Record
  // exhaustive over Role.
  admin: "Admin"
};

export function participantKey(role: Role, displayName: string): string {
  return `${role}:${displayName.trim()}`;
}

export function parseParticipantKey(key: string): { role: Role; name: string } | null {
  const idx = key.indexOf(":");
  if (idx <= 0) return null;
  const role = key.slice(0, idx) as Role;
  if (role !== "brand" && role !== "agency" && role !== "influencer") return null;
  return { role, name: key.slice(idx + 1).trim() };
}

/** All three personas on a finished campaign (current user swaps in for their role). */
export function buildCampaignParticipantKeys(currentRole: Role, currentDisplayName: string): string[] {
  const roles: Role[] = ["brand", "agency", "influencer"];
  return roles.map((r) =>
    r === currentRole ? participantKey(r, currentDisplayName) : participantKey(r, DEMO_PARTNER_BY_ROLE[r])
  );
}
