// Per-section nav accent system, ported from the redesign.
//
// Translation notes (vs. the design repo, which is light-mode only):
//  - Light neutral surfaces (white / slate-50/100/200/300) and neutral text
//    have been swapped to our semantic tokens (card/muted/foreground) so dark
//    mode survives.
//  - The colored nav.* pastel ramps gain `dark:` variants so their light
//    pastel surfaces don't break dark mode.
//  - Mid/dark slate solids paired with white text (the neutral "dashboard"
//    section accent) are kept as-is: they're theme-independent and readable in
//    both modes, and our token palette has no neutral-grey accent equivalent.

export const SIDEBAR_SURFACE_CLASS = "bg-gradient-to-b from-card via-card to-muted/40";

const NAV_ROUTES = [
  "/smart-plan",
  "/dashboard",
  "/campaigns",
  "/messages",
  "/discover",
  "/shortlist",
  "/tracking"
] as const;

const NAV_ACTIVE_CLASSES: Record<string, string> = {
  "/dashboard": "bg-muted text-foreground",
  "/campaigns": "bg-nav-bronze-200 text-nav-bronze-900 dark:bg-nav-bronze-900/40 dark:text-nav-bronze-100",
  "/messages": "bg-nav-teal-200 text-nav-teal-900 dark:bg-nav-teal-900/40 dark:text-nav-teal-100",
  "/discover": "bg-nav-ocean-200 text-nav-ocean-900 dark:bg-nav-ocean-900/40 dark:text-nav-ocean-100",
  "/shortlist": "bg-nav-rose-200 text-nav-rose-900 dark:bg-nav-rose-900/40 dark:text-nav-rose-100",
  "/smart-plan": "bg-nav-burnt-200 text-nav-burnt-900 dark:bg-nav-burnt-900/40 dark:text-nav-burnt-100",
  "/tracking": "bg-nav-forest-200 text-nav-forest-900 dark:bg-nav-forest-900/40 dark:text-nav-forest-100"
};

const NAV_BUTTON_CLASSES: Record<string, string> = {
  "/dashboard": "bg-slate-600 text-white hover:bg-slate-700",
  "/campaigns": "bg-nav-bronze-900 text-white hover:bg-nav-bronze-800",
  "/messages": "bg-nav-teal-900 text-white hover:bg-nav-teal-800",
  "/discover": "bg-nav-ocean-900 text-white hover:bg-nav-ocean-800",
  "/shortlist": "bg-nav-rose-900 text-white hover:bg-nav-rose-800",
  "/smart-plan": "bg-nav-burnt-900 text-white hover:bg-nav-burnt-800",
  "/tracking": "bg-nav-forest-900 text-white hover:bg-nav-forest-800"
};

const NAV_SOLID_CLASSES: Record<string, string> = {
  "/dashboard": "bg-slate-600",
  "/campaigns": "bg-nav-bronze-900",
  "/messages": "bg-nav-teal-900",
  "/discover": "bg-nav-ocean-900",
  "/shortlist": "bg-nav-rose-900",
  "/smart-plan": "bg-nav-burnt-900",
  "/tracking": "bg-nav-forest-900"
};

const NAV_ACCENT_TEXT_CLASSES: Record<string, string> = {
  "/dashboard": "text-foreground",
  "/campaigns": "text-nav-bronze-900 dark:text-nav-bronze-100",
  "/messages": "text-nav-teal-900 dark:text-nav-teal-100",
  "/discover": "text-nav-ocean-900 dark:text-nav-ocean-100",
  "/shortlist": "text-nav-rose-900 dark:text-nav-rose-100",
  "/smart-plan": "text-nav-burnt-900 dark:text-nav-burnt-100",
  "/tracking": "text-nav-forest-900 dark:text-nav-forest-100"
};

const NAV_INDICATOR_CLASSES: Record<string, string> = {
  "/dashboard": "bg-slate-600",
  "/campaigns": "bg-nav-bronze-900",
  "/messages": "bg-nav-teal-900",
  "/discover": "bg-nav-ocean-900",
  "/shortlist": "bg-nav-rose-900",
  "/smart-plan": "bg-nav-burnt-900",
  "/tracking": "bg-nav-forest-900"
};

const NAV_ICON_ACTIVE_CLASSES: Record<string, string> = {
  "/dashboard": "text-foreground",
  "/campaigns": "text-nav-bronze-900 dark:text-nav-bronze-100",
  "/messages": "text-nav-teal-900 dark:text-nav-teal-100",
  "/discover": "text-nav-ocean-900 dark:text-nav-ocean-100",
  "/shortlist": "text-nav-rose-900 dark:text-nav-rose-100",
  "/smart-plan": "text-nav-burnt-900 dark:text-nav-burnt-100",
  "/tracking": "text-nav-forest-900 dark:text-nav-forest-100"
};

const NAV_PAGE_BG_CLASSES: Record<string, string> = {
  "/dashboard": "bg-muted/50",
  "/campaigns": "bg-nav-bronze-100 dark:bg-nav-bronze-900/25",
  "/messages": "bg-nav-teal-100 dark:bg-nav-teal-900/25",
  "/discover": "bg-nav-ocean-100 dark:bg-nav-ocean-900/25",
  "/shortlist": "bg-nav-rose-100 dark:bg-nav-rose-900/25",
  "/smart-plan": "bg-nav-burnt-100 dark:bg-nav-burnt-900/25",
  "/tracking": "bg-nav-forest-100 dark:bg-nav-forest-900/25"
};

function matchNavRoute(pathname: string): string {
  const match = NAV_ROUTES.find((route) => pathname === route || pathname.startsWith(`${route}/`));
  return match ?? "/dashboard";
}

export function getNavActiveClass(href: string): string {
  return NAV_ACTIVE_CLASSES[href] ?? "bg-muted text-foreground";
}

export function getNavLinkClass(href: string, isActive: boolean): string {
  return isActive ? getNavActiveClass(href) : "text-muted-foreground hover:bg-muted/60 hover:text-foreground";
}

export function getNavIndicatorClass(href: string): string {
  return NAV_INDICATOR_CLASSES[href] ?? NAV_INDICATOR_CLASSES["/dashboard"];
}

export function getNavIconActiveClass(href: string): string {
  return NAV_ICON_ACTIVE_CLASSES[href] ?? NAV_ICON_ACTIVE_CLASSES["/dashboard"];
}

export function getPageButtonClass(pathname: string): string {
  return NAV_BUTTON_CLASSES[matchNavRoute(pathname)];
}

export function getPageButtonClassForRoute(route: string): string {
  return NAV_BUTTON_CLASSES[route] ?? NAV_BUTTON_CLASSES["/dashboard"];
}

export function getPageSolidClassForRoute(route: string): string {
  return NAV_SOLID_CLASSES[route] ?? NAV_SOLID_CLASSES["/dashboard"];
}

export function getPageAccentTextClassForRoute(route: string): string {
  return NAV_ACCENT_TEXT_CLASSES[route] ?? NAV_ACCENT_TEXT_CLASSES["/dashboard"];
}

export function getPageBgClass(pathname: string): string {
  return NAV_PAGE_BG_CLASSES[matchNavRoute(pathname)];
}
