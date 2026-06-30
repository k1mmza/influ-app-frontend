"use client";

import { getRoleTheme } from "@/lib/role-theme";
import { useUserStore } from "@/store/useUserStore";

export function useRoleTheme() {
  const role = useUserStore((s) => s.role);
  return getRoleTheme(role);
}
