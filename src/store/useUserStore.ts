"use client";

import { Role } from "@/lib/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiLogin, apiRegister, apiSelectRole } from "@/lib/api";

interface UserState {
  name: string;
  email: string;
  role: Role | null;
  token: string | null;
  /** Set true after sign-in so shell UI (e.g. footer) can hide for the session. */
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: Role) => Promise<void>;
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
      isLoggedIn: false,
      login: async (email: string, password: string) => {
        const data = await apiLogin(email, password);
        // Backend returns access_token. In a real app we might fetch user profile here.
        set({
          token: data.access_token,
          email: email,
          isLoggedIn: true,
          // Temporary role fallback if backend doesn't return user profile in login yet
          role: "brand",
        });
      },
      register: async (name: string, email: string, password: string, role: Role) => {
        const data = await apiRegister(name, email, password);
        await apiSelectRole(data.access_token, role);
        set({
          token: data.access_token,
          name,
          email,
          role,
          isLoggedIn: true,
        });
      },
      setRole: (role) => set({ role }),
      logout: () => {
        set({ role: null, name: "", email: "", token: null, isLoggedIn: false });
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("influapp-user");
        }
      }
    }),
    { name: "influapp-user" }
  )
);
