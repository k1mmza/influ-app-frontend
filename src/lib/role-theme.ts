import type { Role } from "@/lib/types";

/** Role-based colors for profile pages and the profile chip (not sidebar nav colors).
 *
 *  Ported from the redesign with SPEC role colors (Brand Navy #1e3a8a via
 *  `role-navy`, Agency Emerald #059669 via Tailwind `emerald-600`, Influencer
 *  Coral #f87171 via `role-coral`). Literal `bg-white` → `bg-background` and
 *  `text-slate-900` → `text-foreground` so dark mode survives; emerald and the
 *  role-* tokens are intentional identity colors and kept as-is.
 *
 *  NOTE: these are light-leaning profile surfaces. They are not mounted in
 *  Tier 1 (profile-card / user-profile-chip are ported but not yet wired);
 *  dark-variant tuning of the page-level surfaces belongs to the Tier 2/3
 *  passes where they actually render.
 */
export interface RoleTheme {
  pageBg: string;
  profileChip: string;
  profileChipActive: string;
  cardBg: string;
  profileHeader: string;
  profileAccent: string;
  profileHeaderButton: string;
  profileOutlineButton: string;
  profileNotice: string;
}

const ROLE_THEMES: Record<Role, RoleTheme> = {
  brand: {
    pageBg: "bg-role-navy-50 dark:bg-role-navy/10",
    profileChip: "bg-role-navy/10 text-role-navy hover:bg-role-navy/15 dark:bg-role-navy/20 dark:text-role-navy-50 dark:hover:bg-role-navy/30",
    profileChipActive: "bg-role-navy text-white shadow-md",
    cardBg: "bg-role-navy/10 border border-role-navy/20",
    profileHeader: "bg-role-navy",
    profileAccent: "text-role-navy dark:text-role-navy-50",
    profileHeaderButton: "bg-background text-role-navy hover:bg-role-navy-50 dark:text-role-navy-50 dark:hover:bg-role-navy/20",
    profileOutlineButton: "border border-role-navy/25 bg-background text-role-navy hover:bg-role-navy-50 dark:text-role-navy-50 dark:hover:bg-role-navy/20",
    profileNotice: "border border-role-navy/20 bg-role-navy-50 text-role-navy dark:bg-role-navy/10 dark:text-role-navy-50"
  },
  agency: {
    pageBg: "bg-emerald-50 dark:bg-emerald-500/10",
    profileChip: "bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/25",
    profileChipActive: "bg-emerald-600 text-white shadow-md",
    cardBg: "bg-emerald-100 border border-emerald-200 dark:bg-emerald-500/15 dark:border-emerald-500/25",
    profileHeader: "bg-emerald-600",
    profileAccent: "text-emerald-800 dark:text-emerald-300",
    profileHeaderButton: "bg-background text-emerald-800 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-500/15",
    profileOutlineButton: "border border-emerald-300 bg-background text-emerald-800 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-500/15",
    profileNotice: "border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200"
  },
  influencer: {
    pageBg: "bg-role-coral-50 dark:bg-role-coral/10",
    profileChip: "bg-role-coral/15 text-foreground hover:bg-role-coral/25",
    profileChipActive: "bg-role-coral text-white shadow-md",
    cardBg: "bg-role-coral/15 border border-role-coral/25",
    profileHeader: "bg-role-coral",
    profileAccent: "text-role-coral",
    profileHeaderButton: "bg-background text-foreground hover:bg-role-coral-50 dark:hover:bg-role-coral/15",
    profileOutlineButton: "border border-role-coral/30 bg-background text-foreground hover:bg-role-coral-50 dark:hover:bg-role-coral/15",
    profileNotice: "border border-role-coral/25 bg-role-coral-50 text-foreground dark:bg-role-coral/10"
  }
};

export function getRoleTheme(role: Role | null | undefined): RoleTheme {
  return ROLE_THEMES[role ?? "agency"];
}
