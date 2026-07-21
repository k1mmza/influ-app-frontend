"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  Activity,
  Compass,
  Heart,
  LayoutDashboard,
  Megaphone,
  Menu,
  MessageSquare,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getNavIconActiveClass, getNavIndicatorClass, getNavLinkClass } from "@/lib/nav-theme";
import { getSidebarMenuHeading, getSidebarWorkspaceLabel } from "@/lib/role-labels";
import { useSidebarOptional } from "@/components/sidebar-context";
import { useUserStore } from "@/store/useUserStore";
import { ThemeToggle } from "@/components/theme-toggle";
import { ReadableToggle } from "@/components/readable-toggle";
import type { Role } from "@/lib/types";

type NavLink = { href: string; label: string; icon: LucideIcon };

// Brand and agency share the full menu (incl. /shortlist per D2).
const brandAgencyLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/campaigns", label: "Campaign", icon: Megaphone },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/shortlist", label: "Shortlist", icon: Heart },
  { href: "/smart-plan", label: "Smart Plan", icon: Sparkles },
  { href: "/messages", label: "Message", icon: MessageSquare },
  { href: "/tracking", label: "Tracking", icon: Activity },
];

const navLinksByRole: Record<Role, NavLink[]> = {
  brand: brandAgencyLinks,
  agency: brandAgencyLinks,
  influencer: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/campaigns", label: "Campaign", icon: Megaphone },
    { href: "/messages", label: "Message", icon: MessageSquare },
  ],
};

function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navigation() {
  const pathname = usePathname();
  const { role, isLoggedIn, name } = useUserStore();
  const sidebar = useSidebarOptional();

  // Mobile: below lg the sidebar stacks above content, so its full vertical menu
  // would fill a small screen ("only menu" bug). Collapse it behind a top-bar
  // hamburger — closed by default. State lives in SidebarContext so NavFooter
  // (a sibling) hides/shows in lockstep. Auto-close on navigation.
  const mobileOpen = sidebar?.mobileOpen ?? false;
  const setMobileOpen = sidebar?.setMobileOpen;
  useEffect(() => {
    setMobileOpen?.(false);
  }, [pathname, setMobileOpen]);

  const isLandingPage = pathname === "/";
  const isPublicPage =
    isLandingPage ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/how-it-works" ||
    pathname === "/creators" ||
    pathname === "/agencies" ||
    pathname === "/terms" ||
    pathname === "/privacy" ||
    pathname === "/cookies" ||
    (pathname === "/discover" && !isLoggedIn);
  const isAuthPage = ["/forgot-password", "/reset-password", "/auth/callback"].includes(pathname);

  const collapsed = sidebar?.collapsed ?? false;

  // N1: nav renders nothing on auth routes.
  if (isAuthPage) {
    return null;
  }

  // N2: keep our existing public/landing top-nav (tokenized, tooltips,
  // ThemeToggle, real info links). NOT the design's light-only landing nav.
  if (isPublicPage) {
    const publicNavLinks = [
      { href: "/discover", label: "Discover", tip: "Search and filter creators" },
      { href: "/how-it-works", label: "How it Works", tip: "See how Inflique works" },
      { href: "/creators", label: "Creators", tip: "Join as a creator" },
      { href: "/agencies", label: "Agencies & Brands", tip: "Start running campaigns" },
    ];

    // Composition ported from stitch-export/landing-page (the <header> block):
    // italic serif wordmark in accent, small uppercase label links centred, and
    // a squared "Get started" button — not the previous pill nav.
    //
    // Colours stay on the --lp-* variables rather than the hardcoded tv-*
    // utilities for two reasons: --lp-* is theme-reactive so the ThemeToggle
    // keeps working here, and it is scope-reactive so this same nav renders
    // travelogue inside .tv-scope (marketing) and porcelain on logged-out
    // /discover, which is still on the old design.
    return (
      <nav className="sticky top-0 z-50 mb-8 w-full border-b border-[var(--lp-line)] bg-[var(--lp-paper)]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-4 sm:px-8">
          <Link
            href="/"
            className="shrink-0 px-1 font-[family-name:var(--font-display)] text-2xl italic text-[var(--lp-accent)] transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-accent)]"
          >
            Inflique
          </Link>

          <div className="hidden flex-1 items-center justify-center gap-8 md:flex">
            {publicNavLinks.map(({ href, label, tip }) => {
              const active = pathname === href;
              return (
                <div key={href} className="group relative">
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex items-center font-[family-name:var(--font-grotesk)] text-[12px] font-semibold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-accent)]",
                      active
                        ? "text-[var(--lp-accent)] underline decoration-[1.5px] underline-offset-[6px]"
                        : "text-[var(--lp-ink-soft)] hover:text-[var(--lp-accent)]"
                    )}
                  >
                    {label}
                  </Link>
                  <div className="pointer-events-none absolute left-1/2 top-full mt-3 -translate-x-1/2 whitespace-nowrap border border-[var(--lp-line)] bg-[var(--lp-surface)] px-3 py-1.5 font-[family-name:var(--font-grotesk)] text-xs font-medium text-[var(--lp-ink-soft)] opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">
                    {tip}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {/* Kept per request: readable-mode and light/dark toggles. The Stitch
                header has neither — it is a static light-only mockup. */}
            <ReadableToggle />
            <ThemeToggle />
            {isLoggedIn ? (
              <Link href="/dashboard" className="cursor-pointer">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--lp-accent)] font-[family-name:var(--font-grotesk)] text-sm font-bold text-[var(--lp-accent-ink)] transition hover:brightness-110">
                  {name ? name.charAt(0).toUpperCase() : "U"}
                </span>
              </Link>
            ) : (
              <>
                {pathname !== "/login" && (
                  <Link
                    href="/login"
                    className="hidden font-[family-name:var(--font-grotesk)] text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--lp-ink-soft)] transition-colors hover:text-[var(--lp-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-accent)] sm:inline-flex"
                  >
                    Log in
                  </Link>
                )}
                {pathname !== "/register" && (
                  <Link
                    href="/register"
                    className="inline-flex items-center rounded-[2px] bg-[var(--lp-accent)] px-6 py-2.5 font-[family-name:var(--font-grotesk)] text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--lp-accent-ink)] transition-all hover:brightness-[1.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--lp-paper)] active:scale-95"
                  >
                    Get started
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </nav>
    );
  }

  // Authed collapsible sidebar (the design shell). N4: role-based links; crash
  // guard for null role; N3: ThemeToggle preserved; N6: logout.
  const links = role ? navLinksByRole[role] : [];

  return (
    <nav className="flex shrink-0 flex-col">
      <div
        className={cn(
          "flex items-center border-b border-border transition hover:bg-accent/40",
          collapsed ? "justify-center px-2 py-4 lg:px-2" : "justify-between gap-3 px-5 py-5"
        )}
      >
        <Link
          href="/dashboard"
          className={cn("flex min-w-0 items-center", collapsed ? "justify-center" : "gap-3")}
          title={collapsed ? `Inflique — ${getSidebarWorkspaceLabel(role)}` : undefined}
        >
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-base font-bold tracking-tight text-foreground font-serif">Inflique</p>
              <p className="text-xs font-medium text-muted-foreground">{getSidebarWorkspaceLabel(role)}</p>
            </div>
          ) : null}
        </Link>

        {/* Mobile-only menu toggle. Hidden at lg where the full sidebar is shown. */}
        <button
          type="button"
          onClick={() => setMobileOpen?.(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-accent hover:text-foreground lg:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "flex-col gap-0.5 py-4 lg:flex",
          collapsed ? "px-2" : "px-3",
          mobileOpen ? "flex" : "hidden"
        )}
      >
        {!collapsed ? (
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {getSidebarMenuHeading(role)}
          </p>
        ) : null}
        {links.map((link) => {
          const active = isNavActive(pathname, link.href);
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              title={collapsed ? link.label : undefined}
              aria-label={link.label}
              className={cn(
                "group relative flex items-center rounded-xl text-sm font-medium transition-all duration-200",
                collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
                getNavLinkClass(link.href, active),
                active && "shadow-sm"
              )}
            >
              {active && !collapsed ? (
                <span
                  className={cn(
                    "absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full",
                    getNavIndicatorClass(link.href)
                  )}
                />
              ) : null}
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0 transition-colors",
                  active ? getNavIconActiveClass(link.href) : "text-muted-foreground group-hover:text-foreground"
                )}
                strokeWidth={active ? 2.25 : 2}
              />
              {!collapsed ? <span className="truncate">{link.label}</span> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
