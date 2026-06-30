"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Navigation } from "@/components/navigation";
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
  const pathname = usePathname() ?? "";
  // A8: Discover portals its filter sidebar into #app-sidebar-slot. Keep the
  // sidebar expanded (and the slot visible) on /discover so collapsing never
  // makes the filters vanish.
  const effectiveCollapsed = collapsed && pathname !== "/discover";

  return (
    <main className={cn("flex min-h-svh w-full flex-col transition-colors duration-300", pageBg)}>
      <div className="flex min-h-0 w-full flex-1 flex-col lg:min-h-svh lg:flex-row">
        <aside
          className={cn(
            "flex w-full shrink-0 flex-col border-b border-border transition-[width] duration-300 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r",
            SIDEBAR_SURFACE_CLASS,
            effectiveCollapsed ? "lg:w-16" : "lg:w-[calc(260px-1cm)]"
          )}
        >
          <Navigation />
          <div
            id="app-sidebar-slot"
            className={cn(
              "min-h-0 flex-1 overflow-y-auto px-3 pb-4 lg:px-4",
              effectiveCollapsed && "hidden lg:hidden"
            )}
          />
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
  const isAuthPage = ["/login", "/register", "/forgot-password", "/auth/callback"].includes(pathname);
  const isPublicInfoPage = pathname === "/how-it-works" || pathname === "/creators" || pathname === "/agencies";
  const isSmartPlanPage = pathname === "/smart-plan" || pathname.startsWith("/smart-plan/");
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

  // A4: landing + public-info pages use the top-nav + footer layout.
  if (isLandingPage || isPublicInfoPage) {
    return (
      <main className="flex min-h-screen flex-col bg-background">
        <div className="mx-auto w-full max-w-7xl px-4 pt-6">
          <Navigation />
        </div>
        <div className="flex-1">{children}</div>
        <div className="mx-auto w-full max-w-6xl px-4 pb-6">
          <SiteFooter />
        </div>
        <ShortlistErrorToast error={error} onDismiss={clearError} />
      </main>
    );
  }

  // A5 / D3: smart-plan keeps its own full-bleed layout (no sidebar shell).
  if (isSmartPlanPage) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 lg:px-6">
        {children}
        <ShortlistErrorToast error={error} onDismiss={clearError} />
      </main>
    );
  }

  // A6: logged-out Discover uses the public top-nav + a reachable filter slot,
  // not the authed sidebar.
  if (pathname === "/discover" && !isLoggedIn) {
    return (
      <main className="flex min-h-screen flex-col bg-muted/50">
        <div className="mx-auto w-full max-w-7xl px-4 pt-6 lg:px-8">
          <Navigation />
        </div>
        <div className="mx-auto grid w-full max-w-7xl flex-1 gap-8 px-4 py-6 lg:grid-cols-[240px_1fr] lg:px-8">
          <aside className="sticky top-6 self-start">
            <div id="app-sidebar-slot" />
          </aside>
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
