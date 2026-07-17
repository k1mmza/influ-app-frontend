"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";

const CONSENT_KEY = "influapp-cookie-consent";

/**
 * Lightweight, dismissible cookie notice styled to match the landing surface
 * (the --lp-* "gallery" palette, grotesk type, persimmon accent). Purely
 * informational — the app only stores strictly-necessary auth state in
 * localStorage, so neither choice gates any scripts. Accept / Decline both
 * record the visitor's choice (localStorage flag) so the notice stays dismissed.
 * Mounted globally in the root layout so it appears on every route until acted on.
 */
export function CookieNotice() {
  // Start hidden so SSR and the first client render match; reveal only after we
  // can read localStorage (post-mount), avoiding a hydration mismatch.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(CONSENT_KEY)) setVisible(true);
    } catch {
      // localStorage unavailable (private mode / SSR) — just don't show.
    }
  }, []);

  const record = (choice: "accepted" | "declined") => {
    try {
      localStorage.setItem(CONSENT_KEY, choice);
    } catch {
      // Ignore write failures; hiding for the session is enough.
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed bottom-5 left-5 right-5 z-40 mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-[var(--lp-line)] bg-[var(--lp-surface)] p-4 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.45)] sm:right-auto"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--lp-accent-soft)]">
        <Cookie className="h-4 w-4 text-[var(--lp-accent)]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-[family-name:var(--font-grotesk)] text-sm leading-relaxed text-[var(--lp-ink-soft)]">
          We use essential cookies to keep you signed in and improve your experience.{" "}
          <Link
            href="/cookies"
            className="font-medium text-[var(--lp-accent)] underline underline-offset-2 transition hover:brightness-[1.06]"
          >
            Learn more
          </Link>
          .
        </p>
        <div className="mt-3 flex items-center gap-2 pr-[10%]">
          <button
            type="button"
            onClick={() => record("accepted")}
            className="inline-flex h-9 flex-1 items-center justify-center rounded-xl bg-[var(--lp-accent)] px-4 font-[family-name:var(--font-grotesk)] text-sm font-semibold text-[var(--lp-accent-ink)] transition hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--lp-surface)] active:scale-[0.99] cursor-pointer"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => record("declined")}
            className="inline-flex h-9 flex-1 items-center justify-center rounded-xl border border-[var(--lp-line)] bg-[var(--lp-surface)] px-4 font-[family-name:var(--font-grotesk)] text-sm font-semibold text-[var(--lp-ink)] transition hover:border-[var(--lp-accent-line)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--lp-surface)] cursor-pointer"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
