"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { SiteFooter } from "@/components/site-footer";
import { useUserStore } from "@/store/useUserStore";
import { useShortlistStore } from "@/store/useShortlistStore";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const isLandingPage = pathname === "/";
  const isAuthPage = ["/login", "/register", "/forgot-password", "/auth/callback"].includes(pathname);
  const isPublicInfoPage = pathname === "/how-it-works" || pathname === "/creators" || pathname === "/agencies";
  const isSmartPlanPage = pathname === "/smart-plan" || pathname.startsWith("/smart-plan/");
  const { isLoggedIn, token, role } = useUserStore();
  const { error, clearError, syncFromServer } = useShortlistStore();

  // Seed shortlist from server as soon as the user is authenticated and
  // has a role that can use shortlists (BRAND or AGENCY).
  // This runs on every page so heart icons are correct on Discover and
  // everywhere else without requiring a visit to /shortlist first.
  useEffect(() => {
    if (isLoggedIn && token && (role === "brand" || role === "agency")) {
      syncFromServer(token);
    }
  }, [isLoggedIn, token, role, syncFromServer]);

  // Auto-dismiss the shortlist error toast after 4 s
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(clearError, 4000);
    return () => clearTimeout(t);
  }, [error, clearError]);

  if (isAuthPage) {
    return <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">{children}</main>;
  }

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

  if (isSmartPlanPage) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 lg:px-6">
        {children}
        <ShortlistErrorToast error={error} onDismiss={clearError} />
      </main>
    );
  }

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

  return (
    <main className="flex min-h-screen flex-col bg-muted/50 px-4 py-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="sticky top-6 self-start">
          <Navigation />
          <div id="app-sidebar-slot" className="mt-4" />
        </aside>
        <section className="min-h-[calc(100vh-3rem)]">{children}</section>
      </div>
      <ShortlistErrorToast error={error} onDismiss={clearError} />
    </main>
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
