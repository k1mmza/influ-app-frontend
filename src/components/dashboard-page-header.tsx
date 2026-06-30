"use client";

import {
  getPageAccentTextClassForRoute,
  getPageSolidClassForRoute
} from "@/lib/nav-theme";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const pageSolid = getPageSolidClassForRoute("/dashboard");
const pageAccent = getPageAccentTextClassForRoute("/dashboard");

export function DashboardPageHeader({
  title,
  subtitle,
  badge,
  action
}: {
  title: string;
  subtitle: string;
  badge?: string;
  action?: ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl p-6 text-white shadow-sm", pageSolid)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-white/80">{subtitle}</p>
          {badge ? (
            <div className="mt-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
              {badge}
            </div>
          ) : null}
        </div>
        {action}
      </div>
    </div>
  );
}

export function DashboardHeaderAction({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "shrink-0 rounded-xl bg-background px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-muted",
        pageAccent,
        className
      )}
    >
      {children}
    </div>
  );
}
