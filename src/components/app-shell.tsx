"use client";

import { usePathname } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { SiteFooter } from "@/components/site-footer";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const isLandingPage = pathname === "/";
  const isAuthPage = ["/login", "/register", "/forgot-password"].includes(pathname);
  const isSmartPlanPage = pathname === "/smart-plan" || pathname.startsWith("/smart-plan/");

  if (isAuthPage) {
    return <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">{children}</main>;
  }

  if (isLandingPage) {
    return (
      <main className="flex min-h-screen flex-col">
        <div className="mx-auto w-full max-w-6xl px-4 pt-6">
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
    return <main className="min-h-screen bg-white px-4 py-6 lg:px-6">{children}</main>;
  }

  return (
    <main className="flex min-h-screen flex-col px-4 py-6 lg:px-6">
      <div className="grid flex-1 gap-6 lg:grid-cols-[220px_1fr]">
        <aside>
          <Navigation />
          <div id="app-sidebar-slot" className="mt-4" />
        </aside>
        <section>{children}</section>
      </div>
    </main>
  );
}
