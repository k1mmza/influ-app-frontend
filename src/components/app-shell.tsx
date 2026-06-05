"use client";

import { usePathname } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { SiteFooter } from "@/components/site-footer";
import { useUserStore } from "@/store/useUserStore";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const isLandingPage = pathname === "/";
  const isAuthPage = ["/login", "/register", "/forgot-password", "/auth/callback"].includes(pathname);
  const isPublicInfoPage = pathname === "/how-it-works" || pathname === "/creators" || pathname === "/agencies";
  const isSmartPlanPage = pathname === "/smart-plan" || pathname.startsWith("/smart-plan/");
  const { isLoggedIn } = useUserStore();

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
      </main>
    );
  }

  if (isSmartPlanPage) {
    return <main className="min-h-screen bg-background px-4 py-6 lg:px-6">{children}</main>;
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
    </main>
  );
}
