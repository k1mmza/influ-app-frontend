"use client";

import { useRouter } from "next/navigation";
import { LogOut, PanelLeft, PanelLeftClose } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarOptional } from "@/components/sidebar-context";
import { UserProfileChip } from "@/components/user-profile-chip";
import { useProfileAvatar } from "@/lib/use-profile-avatar";
import { useUserStore } from "@/store/useUserStore";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Sidebar footer (collapse toggle, theme, logout, profile chip), extracted from
 * Navigation so the authed <aside> can flow as: Navigation (shrink-0) →
 * flex-1 spacer → NavFooter (shrink-0). Being the last shrink-0 child after a
 * flex-1 sibling pins it to the bottom naturally — no mt-auto / h-full stretch
 * needed.
 */
export function NavFooter() {
  const router = useRouter();
  const { logout } = useUserStore();
  const sidebar = useSidebarOptional();
  const avatarUrl = useProfileAvatar();

  const collapsed = sidebar?.collapsed ?? false;
  const toggleCollapsed = sidebar?.toggleCollapsed;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className={cn("shrink-0", collapsed ? "p-2" : "p-3")}>
      {toggleCollapsed ? (
        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "group mb-2 hidden w-full items-center rounded-xl text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground lg:flex",
            collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
          )}
        >
          {collapsed ? (
            <PanelLeft className="h-[18px] w-[18px] shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
          ) : (
            <PanelLeftClose className="h-[18px] w-[18px] shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
          )}
          {!collapsed ? <span>Collapse</span> : null}
        </button>
      ) : null}

      {/* N3: ThemeToggle / dark mode preserved in the authed sidebar. */}
      <div className={cn("mb-2 flex items-center", collapsed ? "justify-center" : "gap-3 px-1")}>
        <ThemeToggle />
        {!collapsed ? <span className="text-sm font-medium text-muted-foreground">Theme</span> : null}
      </div>

      <button
        type="button"
        onClick={handleLogout}
        title={collapsed ? "Log out" : undefined}
        aria-label="Log out"
        className={cn(
          "group mb-2 flex w-full items-center rounded-xl text-sm font-medium text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive",
          collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
        )}
      >
        <LogOut className="h-[18px] w-[18px] shrink-0 transition-colors" />
        {!collapsed ? "Log out" : null}
      </button>

      <div className={cn(collapsed ? "flex justify-center" : "w-full")}>
        <UserProfileChip
          collapsed={collapsed}
          avatarUrl={avatarUrl}
          className={cn(!collapsed && "flex w-full gap-3 px-3 py-2.5")}
        />
      </div>
    </div>
  );
}
