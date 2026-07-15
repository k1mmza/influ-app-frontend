"use client";

import { Role } from "@/lib/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  apiLogin,
  apiRegister,
  apiSelectRole,
  apiRefresh,
  apiLogout,
  registerTokenRefresher,
} from "@/lib/api";
import { useMediaKitStore } from "@/store/useMediaKitStore";

// ── Storage decision ─────────────────────────────────────────────────────────
// Accounts (including refresh tokens) live in localStorage, NOT httpOnly cookies.
// The frontend (Vercel) and backend (Render) sit on different domains, so a
// cross-site httpOnly-cookie session would need its own CORS + SameSite=None +
// credentials setup — a separate project. localStorage keeps this a single,
// self-contained change. Tradeoff: tokens are readable by JS (XSS-exposed), so
// access tokens are kept short-lived (15m) and every session is revocable
// server-side via POST /auth/logout. Revisit with cookies if we ever share a
// parent domain between the two deployments.

/** One stored, independently-switchable session (Gmail-style multi-account). */
export interface Account {
  id: string; // backend user id — the stable key we dedupe/switch on
  accessToken: string;
  refreshToken: string;
  name: string;
  email: string;
  role: Role | null;
  isRoleSelected: boolean;
}

interface OAuthSession {
  id: string;
  token: string;
  refreshToken: string;
  name: string;
  email: string;
  role: Role | null;
  isRoleSelected: boolean;
}

interface UserState {
  // ── Multi-account state ──
  accounts: Account[];
  activeAccountId: string | null;

  // ── Active-account mirror ──
  // These flat fields always reflect the active account so the whole app can
  // keep reading `token` / `role` / `name` off the store unchanged. They are
  // derived, never the source of truth — always recomputed from accounts +
  // activeAccountId via `mirror()`.
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

  // Auth flows (each ADDS an account and makes it active — "add another account")
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: Role) => Promise<void>;
  setOAuthSession: (session: OAuthSession) => void;

  // Multi-account management
  switchAccount: (id: string) => Promise<void>;
  removeAccount: (id: string) => void;
  logout: () => void; // sign out ONLY the active account
  logoutAll: () => void;

  setRole: (role: Role) => void;

  // Used by the api-client interceptor — never call directly from UI.
  refreshAccountToken: (expiredAccessToken: string) => Promise<string | null>;
}

/** Recompute the active-account mirror from the account list. */
function mirror(accounts: Account[], activeAccountId: string | null) {
  const active = accounts.find((a) => a.id === activeAccountId) ?? null;
  return {
    accounts,
    activeAccountId: active ? activeAccountId : null,
    token: active?.accessToken ?? null,
    name: active?.name ?? "",
    email: active?.email ?? "",
    role: active?.role ?? null,
    isRoleSelected: active?.isRoleSelected ?? false,
    isLoggedIn: !!active,
  };
}

/** Best-effort JWT `exp` check (no signature verification — just avoids a
 *  guaranteed-401 round trip when switching to a visibly-expired account). */
function isAccessTokenExpired(token: string): boolean {
  try {
    const [, payload] = token.split(".");
    const { exp } = JSON.parse(atob(payload)) as { exp?: number };
    if (!exp) return false;
    return Date.now() >= exp * 1000;
  } catch {
    return false; // unparseable → let the interceptor decide on a real 401
  }
}

// Dedupe concurrent refreshes per account: rotation makes a refresh token
// single-use, so parallel 401s for the same account must share one request or
// the losers get a revoked-token error.
const inflightRefresh = new Map<string, Promise<string | null>>();

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      accounts: [],
      activeAccountId: null,
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
        addAccount(set, get, {
          id: data.user.id,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role?.toLowerCase() || null,
          isRoleSelected: data.user.isRoleSelected,
        });
      },

      register: async (name: string, email: string, password: string, role: Role) => {
        const data = await apiRegister(name, email, password);
        // Select role immediately after registration
        await apiSelectRole(data.access_token, role);
        addAccount(set, get, {
          id: data.user.id,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          name,
          email,
          role,
          isRoleSelected: true,
        });
      },

      setOAuthSession: (session) =>
        addAccount(set, get, {
          id: session.id,
          accessToken: session.token,
          refreshToken: session.refreshToken,
          name: session.name,
          email: session.email,
          role: session.role,
          isRoleSelected: session.isRoleSelected,
        }),

      switchAccount: async (id) => {
        const account = get().accounts.find((a) => a.id === id);
        if (!account || id === get().activeAccountId) return;
        // Proactively refresh a visibly-expired token so the switch feels instant.
        if (isAccessTokenExpired(account.accessToken)) {
          await get().refreshAccountToken(account.accessToken);
        }
        useMediaKitStore.getState().resetToDemo();
        set(mirror(get().accounts, id));
      },

      removeAccount: (id) => {
        const { accounts, activeAccountId } = get();
        const account = accounts.find((a) => a.id === id);
        if (!account) return;
        // Revoke this session server-side (fire-and-forget — logout is local-first).
        if (account.refreshToken) void apiLogout(account.refreshToken);

        const remaining = accounts.filter((a) => a.id !== id);
        const wasActive = id === activeAccountId;
        if (remaining.length === 0) {
          useMediaKitStore.getState().resetToDemo();
          set(mirror([], null));
          return;
        }
        if (wasActive) useMediaKitStore.getState().resetToDemo();
        set(mirror(remaining, wasActive ? remaining[0].id : activeAccountId));
      },

      logout: () => {
        const { activeAccountId } = get();
        if (activeAccountId) get().removeAccount(activeAccountId);
      },

      logoutAll: () => {
        get().accounts.forEach((a) => {
          if (a.refreshToken) void apiLogout(a.refreshToken);
        });
        useMediaKitStore.getState().resetToDemo();
        set(mirror([], null));
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("influapp-user");
        }
      },

      setRole: (role) => {
        const { accounts, activeAccountId } = get();
        const next = accounts.map((a) =>
          a.id === activeAccountId ? { ...a, role, isRoleSelected: true } : a,
        );
        set(mirror(next, activeAccountId));
      },

      refreshAccountToken: async (expiredAccessToken) => {
        const account = get().accounts.find((a) => a.accessToken === expiredAccessToken);
        if (!account || !account.refreshToken) return null;

        const existing = inflightRefresh.get(account.id);
        if (existing) return existing;

        const p = (async () => {
          try {
            const { access_token, refresh_token } = await apiRefresh(account.refreshToken);
            const cur = get().accounts.map((a) =>
              a.id === account.id
                ? { ...a, accessToken: access_token, refreshToken: refresh_token }
                : a,
            );
            set(mirror(cur, get().activeAccountId));
            return access_token;
          } catch {
            return null; // refresh token expired/revoked → caller falls back to login
          } finally {
            inflightRefresh.delete(account.id);
          }
        })();
        inflightRefresh.set(account.id, p);
        return p;
      },
    }),
    {
      name: "influapp-user",
      version: 2,
      skipHydration: true,
      partialize: (s) => ({
        accounts: s.accounts,
        activeAccountId: s.activeAccountId,
        // Persist the mirror too so a refresh restores the active session without
        // waiting for a recompute.
        token: s.token,
        name: s.name,
        email: s.email,
        role: s.role,
        isRoleSelected: s.isRoleSelected,
        isLoggedIn: s.isLoggedIn,
      }),
      // v1 stored a single flat session (token/name/email/role). Wrap it as the
      // sole account so existing logged-in users aren't bounced to /login. Old
      // sessions have no refresh token, so once their (1d) access token lapses
      // the interceptor can't refresh and they'll re-login once — acceptable.
      migrate: (persisted, version) => {
        const p = (persisted ?? {}) as Record<string, unknown>;
        if (version < 2 && typeof p.token === "string" && p.token) {
          const account: Account = {
            id: (p.email as string) || "legacy",
            accessToken: p.token as string,
            refreshToken: "",
            name: (p.name as string) || "",
            email: (p.email as string) || "",
            role: (p.role as Role | null) ?? null,
            isRoleSelected: !!p.isRoleSelected,
          };
          return { ...p, ...mirror([account], account.id) };
        }
        return p;
      },
      onRehydrateStorage: () => (state) => {
        // Runs when persist.rehydrate() completes (success or not); flip the flag
        // so guards know the persisted session has been read from localStorage.
        state?.setHasHydrated(true);
      },
    },
  ),
);

/**
 * Upsert an account and make it active ("Add another account"). Re-logging into
 * an account already in the list updates its tokens rather than duplicating it.
 */
function addAccount(
  set: (partial: Partial<UserState>) => void,
  get: () => UserState,
  account: Account,
) {
  const others = get().accounts.filter((a) => a.id !== account.id);
  // Switching to a different account: clear the previous one's per-account UI state.
  if (get().activeAccountId && get().activeAccountId !== account.id) {
    useMediaKitStore.getState().resetToDemo();
  }
  set(mirror([...others, account], account.id));
}

// Wire the api-client silent-refresh interceptor to this store. The interceptor
// hands us an expired access token; we refresh whichever account owns it.
registerTokenRefresher((expiredAccessToken) =>
  useUserStore.getState().refreshAccountToken(expiredAccessToken),
);
