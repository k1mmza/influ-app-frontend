import type { Role } from "@/lib/types";

/** User-facing role name shown in sidebar, profile chip, and auth flows.
 *  Accepts null/undefined (our role is null pre-role-select) → defaults to "Agency". */
export function getRoleLabel(role: Role | string | null | undefined): string {
  if (role === "brand") return "Brand";
  if (role === "influencer") return "Creator";
  if (role === "admin") return "Admin";
  return "Agency";
}

/** Sidebar section heading — makes the active role obvious while browsing nav. */
export function getSidebarMenuHeading(role: Role | string | null | undefined): string {
  return `${getRoleLabel(role)} menu`;
}

/** Subtitle under the app logo in the sidebar. */
export function getSidebarWorkspaceLabel(role: Role | string | null | undefined): string {
  return `${getRoleLabel(role)} workspace`;
}
