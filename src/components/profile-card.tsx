"use client";

import { cn } from "@/lib/utils";
import { useRoleTheme } from "@/lib/use-role-theme";

export function ProfileCard({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const roleTheme = useRoleTheme();

  return (
    <article className={cn("rounded-2xl p-5 shadow-sm", roleTheme.cardBg, className)}>
      {children}
    </article>
  );
}
