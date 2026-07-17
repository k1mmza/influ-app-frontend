"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGetProfile } from "@/lib/api";
import { useUserStore } from "@/store/useUserStore";

/** Fired by the profile page after the user changes/removes their avatar, so
 *  every mounted useProfileAvatar re-fetches and stays in sync without a reload. */
export const AVATAR_UPDATED_EVENT = "inflique:avatar-updated";

/** Broadcast that the signed-in user's avatar changed. Call after a successful
 *  upload / pick / remove so the sidebar chip and account switcher refresh. */
export function notifyAvatarUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AVATAR_UPDATED_EVENT));
  }
}

/**
 * Resolves the signed-in user's real uploaded avatar for the sidebar chip and
 * account switcher.
 *
 * The avatar is server-side only (apiGetProfile(token).avatarUrl) — it is NOT
 * in useUserStore, and we must not widen that store. This hook fetches it once
 * per session/token AND whenever an AVATAR_UPDATED_EVENT fires (so changing the
 * profile picture syncs everywhere immediately). The API returns an absolute
 * avatar URL. Returns null when not logged in or when the user has no uploaded
 * avatar, in which case the caller falls back to a generated avatar.
 */
export function useProfileAvatar(): string | null {
  const token = useUserStore((s) => s.token);
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const fetchAvatar = useCallback(() => {
    if (!isLoggedIn || !token) {
      setAvatarUrl(null);
      return () => {};
    }
    let cancelled = false;
    apiGetProfile(token)
      .then((data) => {
        if (!cancelled) setAvatarUrl(data?.avatarUrl ?? null);
      })
      .catch(() => {
        if (!cancelled) setAvatarUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [token, isLoggedIn]);

  useEffect(() => {
    const cancel = fetchAvatar();
    // Re-fetch when the active user changes their avatar elsewhere in the app.
    window.addEventListener(AVATAR_UPDATED_EVENT, fetchAvatar);
    return () => {
      cancel();
      window.removeEventListener(AVATAR_UPDATED_EVENT, fetchAvatar);
    };
  }, [fetchAvatar]);

  return avatarUrl;
}
