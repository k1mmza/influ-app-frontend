"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type SidebarContextValue = {
  collapsed: boolean;
  toggleCollapsed: () => void;
  // Mobile (< lg): the sidebar stacks above content, so links + footer are
  // hidden behind a top-bar hamburger. Shared here so Navigation (the toggle)
  // and NavFooter (a sibling) can both read it.
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

const STORAGE_KEY = "inflique-sidebar-collapsed";

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  // Collapse is a desktop-only rail affordance (the toggle is lg:-only). Track
  // whether we're at lg+ so the collapsed styling never leaks into the mobile,
  // full-width sidebar (where it would render as centered, label-less icons).
  const [isLgUp, setIsLgUp] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setCollapsed(true);
    setHydrated(true);
  }, []);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsLgUp(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed, hydrated]);

  const toggleCollapsed = () => setCollapsed((current) => !current);

  return (
    <SidebarContext.Provider
      // Raw `collapsed` drives the toggle + persistence; consumers only ever see
      // it as true on lg+, so mobile always renders the expanded sidebar.
      value={{ collapsed: collapsed && isLgUp, toggleCollapsed, mobileOpen, setMobileOpen }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
}

export function useSidebarOptional() {
  return useContext(SidebarContext);
}
