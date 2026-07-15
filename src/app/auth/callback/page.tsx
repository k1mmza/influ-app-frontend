"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { apiGetProfile } from "@/lib/api";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setOAuthSession } = useUserStore();

  useEffect(() => {
    const token = searchParams.get("token");
    const refresh = searchParams.get("refresh") ?? "";
    const roleSelected = searchParams.get("roleSelected") === "true";

    if (!token) {
      router.replace("/login?error=oauth_failed");
      return;
    }

    apiGetProfile(token)
      .then((profile) => {
        setOAuthSession({
          id: profile.id,
          token,
          refreshToken: refresh,
          name: profile.name ?? "",
          email: profile.email ?? "",
          role: profile.role?.toLowerCase() ?? null,
          isRoleSelected: roleSelected,
        });
        router.replace(roleSelected ? "/dashboard" : "/register");
      })
      .catch(() => {
        router.replace("/login?error=oauth_failed");
      });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground text-sm animate-pulse">Signing you in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-sm animate-pulse">Loading…</p>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
