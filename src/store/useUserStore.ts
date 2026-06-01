"use client";

import { Role } from "@/lib/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserState {
  name: string;
  email: string;
  role: Role;
  /** Set true after sign-in so shell UI (e.g. footer) can hide for the session. */
  isLoggedIn: boolean;
  signIn: (role: Role) => void;
  setRole: (role: Role) => void;
  logout: () => void;
}

/** Demo display names aligned with profile mocks and partner-review cohorts. */
const defaultNameForRole = (r: Role): string => {
  if (r === "brand") return "David Kim";
  if (r === "influencer") return "Lina Park";
  return "Sarah Chen";
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      name: "Sarah Chen",
      email: "sarah@agency.com",
      role: "agency",
      isLoggedIn: false,
      signIn: (role) => set({ role, name: defaultNameForRole(role), isLoggedIn: true }),
      setRole: (role) => set({ role, name: defaultNameForRole(role) }),
      logout: () => {
        set({ role: "agency", name: defaultNameForRole("agency"), isLoggedIn: false });
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("influapp-user");
        }
      }
    }),
    { name: "influapp-user" }
  )
);
