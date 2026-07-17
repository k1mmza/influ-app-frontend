"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, LogOut, Plus } from "lucide-react";
import { getAvatarUrl } from "@/lib/avatar";
import { getRoleLabel } from "@/lib/role-labels";
import { getRoleTheme } from "@/lib/role-theme";
import { cn } from "@/lib/utils";
import { useProfileAvatar } from "@/lib/use-profile-avatar";
import { useUserStore } from "@/store/useUserStore";

/**
 * Gmail-style account switcher for the sidebar footer. Lists every stored
 * account, indicates the active one, and switches between them without a
 * network round trip (the store silently refreshes an expired token first).
 * "Add another account" reuses the existing login form; per-account and
 * global sign-out revoke sessions server-side via the store.
 *
 * No dropdown primitive exists in ui/, so this is a self-contained
 * click-outside popover that opens UPWARD (it sits at the bottom of the sidebar).
 */
export function AccountSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const router = useRouter();
  const accounts = useUserStore((s) => s.accounts);
  const activeAccountId = useUserStore((s) => s.activeAccountId);
  const switchAccount = useUserStore((s) => s.switchAccount);
  const removeAccount = useUserStore((s) => s.removeAccount);
  const logoutAll = useUserStore((s) => s.logoutAll);

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // The active account's real uploaded avatar (null → fall back to generated).
  // Only the active session's avatar is resolvable client-side; other stored
  // accounts keep their generated avatar until switched to.
  const activeAvatarUrl = useProfileAvatar();

  const active = accounts.find((a) => a.id === activeAccountId) ?? null;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!active) return null;

  const handleSwitch = async (id: string) => {
    setOpen(false);
    if (id === activeAccountId) return;
    await switchAccount(id);
    // Land on the dashboard so role-scoped chrome/data reflect the new account.
    router.push("/dashboard");
  };

  const handleAddAnother = () => {
    setOpen(false);
    router.push("/login");
  };

  const handleSignOutAccount = (id: string) => {
    const wasActive = id === activeAccountId;
    removeAccount(id);
    // After removal the store picks a new active account (or none).
    const remaining = useUserStore.getState().accounts;
    if (remaining.length === 0) {
      setOpen(false);
      router.push("/login");
    } else if (wasActive) {
      setOpen(false);
      router.push("/dashboard");
    }
  };

  const handleSignOutAll = () => {
    setOpen(false);
    logoutAll();
    router.push("/login");
  };

  const activeTheme = getRoleTheme(active.role);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={collapsed ? `${active.name} — switch account` : undefined}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Switch account"
        className={cn(
          "group flex w-full items-center rounded-xl text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground cursor-pointer",
          collapsed ? "justify-center px-2 py-2" : "gap-2 px-2 py-2",
        )}
      >
        <img
          src={activeAvatarUrl ?? getAvatarUrl(active.name, active.role)}
          alt=""
          className="h-7 w-7 shrink-0 rounded-full border border-black/10 object-cover"
        />
        {!collapsed ? (
          <>
            <span className="min-w-0 flex-1 truncate text-left text-xs font-semibold text-foreground">
              {active.name}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" />
          </>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute bottom-full z-50 mb-2 w-64 overflow-hidden rounded-2xl border border-border bg-card shadow-xl",
            collapsed ? "left-0" : "left-0 right-0 w-auto min-w-64",
          )}
        >
          <p className="px-3 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Accounts
          </p>

          <ul className="max-h-64 overflow-y-auto px-1.5">
            {accounts.map((acct) => {
              const isActive = acct.id === activeAccountId;
              const theme = getRoleTheme(acct.role);
              return (
                <li key={acct.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleSwitch(acct.id)}
                    className={cn(
                      "flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2 py-2 text-left transition cursor-pointer",
                      isActive ? theme.profileChip : "hover:bg-accent",
                    )}
                  >
                    <img
                      src={isActive ? (activeAvatarUrl ?? getAvatarUrl(acct.name, acct.role)) : getAvatarUrl(acct.name, acct.role)}
                      alt=""
                      className="h-8 w-8 shrink-0 rounded-full border border-black/10 object-cover"
                    />
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="flex items-center gap-1">
                        <span className="truncate text-xs font-semibold text-foreground">
                          {acct.name}
                        </span>
                        {isActive ? (
                          <Check className={cn("h-3.5 w-3.5 shrink-0", theme.profileAccent)} />
                        ) : null}
                      </span>
                      <span className="block truncate text-[10px] text-muted-foreground">
                        {acct.email}
                      </span>
                      <span className={cn("block text-[10px] font-medium", theme.profileAccent)}>
                        {getRoleLabel(acct.role)}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSignOutAccount(acct.id)}
                    title="Sign out of this account"
                    aria-label={`Sign out of ${acct.email}`}
                    className="mr-1 shrink-0 rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="my-1.5 h-px bg-border" />

          <div className="px-1.5 pb-2">
            <button
              type="button"
              role="menuitem"
              onClick={handleAddAnother}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium text-foreground transition hover:bg-accent cursor-pointer"
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  activeTheme.cardBg,
                )}
              >
                <Plus className={cn("h-4 w-4", activeTheme.profileAccent)} />
              </span>
              Add another account
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={handleSignOutAll}
              className="mt-0.5 flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive cursor-pointer"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center">
                <LogOut className="h-4 w-4" />
              </span>
              Sign out of all accounts
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
