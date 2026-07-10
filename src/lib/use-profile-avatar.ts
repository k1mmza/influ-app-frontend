"use client";

import { useEffect, useState } from "react";
import { apiGetProfile } from "@/lib/api";
import { useUserStore } from "@/store/useUserStore";

/**
 * Resolves the signed-in user's real uploaded avatar for the sidebar chip.
 *
 * The avatar is server-side only (apiGetProfile(token).avatarUrl) — it is NOT
 * in useUserStore, and we must not widen that store. This hook fetches it once
 * per session/token; the API returns an absolute avatar URL. Returns
 * null when not logged in or when the user has no uploaded avatar, in which
 * case UserProfileChip falls back to a generated avatar.
 */
export function useProfileAvatar(): string | null {
  const token = useUserStore((s) => s.token);
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn || !token) {
      setAvatarUrl(null);
      return;
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

  return avatarUrl;
}
