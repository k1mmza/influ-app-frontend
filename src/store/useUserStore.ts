"use client";

import { Role } from "@/lib/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiLogin, apiRegister, apiSelectRole } from "@/lib/api";
import { useMediaKitStore } from "@/store/useMediaKitStore";

interface OAuthSession {
  token: string;
  name: string;
  email: string;
  role: Role | null;
  isRoleSelected: boolean;
}

interface UserState {
  name: string;
  email: string;
  role: Role | null;
  token: string | null;
  isRoleSelected: boolean;
  isLoggedIn: boolean;
  // True once persist has finished reading localStorage. Guards must wait for
  // this before treating an empty token as "logged out" — see skipHydration.
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: Role) => Promise<void>;
  setOAuthSession: (session: OAuthSession) => void;
  setRole: (role: Role) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      name: "",
      email: "",
      role: null,
      token: null,
      isRoleSelected: false,
      isLoggedIn: false,
      hasHydrated: false,
      setHasHydrated: (value: boolean) => set({ hasHydrated: value }),
      login: async (email: string, password: string) => {
        const data = await apiLogin(email, password);
        set({
          token: data.access_token,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role?.toLowerCase() || null,
          isRoleSelected: data.user.isRoleSelected,
          isLoggedIn: true,
        });
      },
      register: async (name: string, email: string, password: string, role: Role) => {
        const data = await apiRegister(name, email, password);
        const token = data.access_token;
        
        // Select role immediately after registration
        await apiSelectRole(token, role);
        
        set({
          token: token,
          name: name,
          email: email,
          role: role,
          isRoleSelected: true,
          isLoggedIn: true,
        });
      },
      setOAuthSession: (session) =>
        set({
          token: session.token,
          name: session.name,
          email: session.email,
          role: session.role,
          isRoleSelected: session.isRoleSelected,
          isLoggedIn: true,
        }),
      setRole: (role) => set({ role, isRoleSelected: true }),
      logout: () => {
        set({ role: null, name: "", email: "", token: null, isRoleSelected: false, isLoggedIn: false });
        useMediaKitStore.getState().resetToDemo();
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("influapp-user");
        }
      }
    }),
    {
      name: "influapp-user",
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        // Runs when persist.rehydrate() completes (success or not); flip the flag
        // so guards know the persisted token has been read from localStorage.
        state?.setHasHydrated(true);
      },
    }
  )
);
