"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { NavFooter } from "@/components/nav-footer";
import { SiteFooter } from "@/components/site-footer";
import { SidebarProvider, useSidebar } from "@/components/sidebar-context";
import { getPageBgClass, SIDEBAR_SURFACE_CLASS } from "@/lib/nav-theme";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/useUserStore";
import { useShortlistStore } from "@/store/useShortlistStore";

/**
 * The authed collapsible sidebar layout (ported from the redesign).
 *
 * D1: no blanket PageContentLayout wrap — children render as-is; the shell only
 * supplies the sidebar chrome + per-route page-bg tint. Pages opt into the
 * header-extracting layout themselves, later.
 */
function AppSidebarLayout({ children, pageBg }: { children: React.ReactNode; pageBg: string }) {
  const { collapsed } = useSidebar();

  return (
    <main className={cn("flex min-h-svh w-full flex-col transition-colors duration-300", pageBg)}>
      <div className="flex min-h-0 w-full flex-1 flex-col lg:min-h-svh lg:flex-row">
        <aside
          className={cn(
            "flex w-full shrink-0 flex-col border-b border-border transition-[width] duration-300 lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:border-b-0 lg:border-r",
            SIDEBAR_SURFACE_CLASS,
            collapsed ? "lg:w-16" : "lg:w-[calc(260px-1cm)]"
          )}
        >
          <Navigation />
          {/* Invisible flex-1 spacer between the nav links and the footer, so
              NavFooter stays pinned to the bottom of the sidebar. */}
          <div className="min-h-0 flex-1" aria-hidden />
          <NavFooter />
        </aside>
        <section className="relative flex min-h-0 min-w-0 flex-1 flex-col px-4 pb-6 pt-4 lg:px-6 lg:pt-5">
          {children}
        </section>
      </div>
    </main>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const isLandingPage = pathname === "/";
  const isAuthPage = ["/forgot-password", "/reset-password", "/auth/callback"].includes(pathname);
  const isPublicInfoPage =
    pathname === "/how-it-works" ||
    pathname === "/creators" ||
    pathname === "/agencies" ||
    pathname === "/terms" ||
    pathname === "/privacy" ||
    pathname === "/cookies";
  // Public "Share Report" / "Share Campaign" links: an account-less visitor opens
  // these, so they must NEVER get the authenticated sidebar chrome. Render bare,
  // full-width — the page supplies its own canvas.
  const isPublicReport =
    pathname.startsWith("/tracking/public/") ||
    pathname.startsWith("/campaigns/public/");
  const pageBg = getPageBgClass(pathname);
  const { isLoggedIn, token, role } = useUserStore();
  const { error, clearError, syncFromServer } = useShortlistStore();

  // A1: Seed shortlist from server as soon as the user is authenticated and has
  // a role that can use shortlists (BRAND or AGENCY). Runs on every page so heart
  // icons are correct on Discover and elsewhere without visiting /shortlist first.
  useEffect(() => {
    if (isLoggedIn && token && (role === "brand" || role === "agency")) {
      syncFromServer(token);
    }
  }, [isLoggedIn, token, role, syncFromServer]);

  // A2: Auto-dismiss the shortlist error toast after 4 s.
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(clearError, 4000);
    return () => clearTimeout(t);
  }, [error, clearError]);

  // A3: auth pages (incl. /auth/callback) render bare — no nav/sidebar.
  if (isAuthPage) {
    return <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">{children}</main>;
  }

  // A3b: public shared report — bare, full-width, no nav/sidebar (no login).
  if (isPublicReport) {
    return <main className="min-h-screen">{children}</main>;
  }

  // A4: landing + public-info + login/register pages use the top-nav + footer layout.
  // This branch's route set is exactly the src/app/(marketing) route group.
  //
  // `tv-scope` is applied HERE rather than in the marketing layout so it wraps
  // Navigation and SiteFooter too — they render as siblings of {children}, so a
  // class on the route-group layout could never reach them, leaving porcelain
  // chrome bracketing a travelogue body. It rebinds --lp-* / font vars for this
  // subtree only (see (marketing)/marketing.css); Navigation's other instance in
  // the authed sidebar is a different <main> and is untouched, as is the
  // logged-out /discover branch below.
  if (isLandingPage || isPublicInfoPage || pathname === "/login" || pathname === "/register") {
    return (
      <main className="tv-scope flex min-h-screen flex-col bg-[var(--lp-paper)]">
        <Navigation />
        <div className="flex-1">{children}</div>
        <div className="mx-auto w-full max-w-6xl px-4 pb-6">
          <SiteFooter />
        </div>
        <ShortlistErrorToast error={error} onDismiss={clearError} />
      </main>
    );
  }

  // A6: logged-out Discover uses the public top-nav + full-width content
  // (filters now render inline at the search bar, not in a sidebar).
  //
  // Carries `tv-scope` like the A4 marketing branch, so the travelogue palette
  // and Playfair/Fira faces reach this page. Without it every --lp-* and
  // --font-* here falls back to the porcelain design and the page renders in
  // persimmon + Bricolage regardless of what the markup asks for. The AUTHED
  // /discover takes the A7 branch below and is deliberately left untouched.
  if (pathname === "/discover" && !isLoggedIn) {
    return (
      <main className="tv-scope flex min-h-screen flex-col bg-[var(--lp-paper)]">
        <Navigation />
        <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8">
          <section className="min-h-[calc(100vh-3rem)]">{children}</section>
        </div>
        <ShortlistErrorToast error={error} onDismiss={clearError} />
      </main>
    );
  }

  // A7: default authed layout — replaced by the design's collapsible sidebar.
  return (
    <SidebarProvider>
      <AppSidebarLayout pageBg={pageBg}>{children}</AppSidebarLayout>
      <ShortlistErrorToast error={error} onDismiss={clearError} />
    </SidebarProvider>
  );
}

function ShortlistErrorToast({ error, onDismiss }: { error: string | null; onDismiss: () => void }) {
  if (!error) return null;
  return (
    <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive shadow-lg backdrop-blur-sm">
      {error}
      <button onClick={onDismiss} className="ml-1 rounded p-0.5 hover:bg-destructive/20 transition-colors cursor-pointer" aria-label="Dismiss">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
