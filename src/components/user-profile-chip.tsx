"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getAvatarUrl } from "@/lib/avatar";
import { getRoleLabel } from "@/lib/role-labels";
import { cn } from "@/lib/utils";
import { useRoleTheme } from "@/lib/use-role-theme";
import { useUserStore } from "@/store/useUserStore";

export function UserProfileChip({
  className,
  collapsed = false,
  avatarUrl
}: {
  className?: string;
  collapsed?: boolean;
  /** Our uploaded avatar URL. When null/undefined, a generated avatar is used. */
  avatarUrl?: string | null;
}) {
  const pathname = usePathname() ?? "";
  const { name, role } = useUserStore();
  const roleTheme = useRoleTheme();
  const isProfileActive = pathname === "/profile" || pathname.startsWith("/profile/");
  // Prefer our uploaded avatar; fall back to a deterministic generated one.
  const resolvedAvatar = avatarUrl ?? getAvatarUrl(name, role);

  return (
    <Link
      href="/profile"
      title={collapsed ? name : undefined}
      className={cn(
        "items-center gap-2 rounded-2xl shadow-sm transition-colors",
        collapsed ? "inline-flex justify-center p-2" : "inline-flex px-2 py-1.5 pr-3",
        isProfileActive ? roleTheme.profileChipActive : roleTheme.profileChip,
        className
      )}
      aria-current={isProfileActive ? "page" : undefined}
      aria-label={collapsed ? `${name}, ${getRoleLabel(role)}` : undefined}
    >
      <img
        src={resolvedAvatar}
        alt=""
        className={cn(
          "shrink-0 rounded-full object-cover",
          collapsed ? "h-9 w-9" : "h-8 w-8",
          isProfileActive ? "border border-white/40" : "border border-black/10"
        )}
      />
      {!collapsed ? (
        <div className="min-w-0 text-left leading-tight">
          <p
            className={cn(
              "max-w-[108px] truncate text-xs font-semibold",
              isProfileActive ? "text-white" : undefined
            )}
          >
            {name}
          </p>
          <p
            className={cn(
              "max-w-[108px] truncate text-[10px] font-medium",
              isProfileActive ? "text-white/80" : "opacity-70"
            )}
          >
            {getRoleLabel(role)}
          </p>
        </div>
      ) : null}
    </Link>
  );
}
