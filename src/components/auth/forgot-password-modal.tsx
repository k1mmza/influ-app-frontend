"use client";

/**
 * "Forgot password?" modal — opened from the login page instead of navigating
 * to a standalone route. Requests a reset link and always shows the same
 * generic confirmation (the backend never reveals whether an account exists, so
 * neither does this dialog). Follows the app's custom overlay-modal pattern
 * (e.g. ShareCampaignModal): backdrop click or the X closes it.
 */

import { useEffect, useState } from "react";
import { CheckCircle2, Mail, X } from "lucide-react";
import { apiForgotPassword } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordModal({
  onClose,
  initialEmail = "",
}: {
  onClose: () => void;
  initialEmail?: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Same confirmation whether or not the email exists — no enumeration.
  const [submitted, setSubmitted] = useState(false);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiForgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not send reset link. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Reset your password"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-bold text-foreground">Reset password</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="space-y-4">
              <CheckCircle2 className="h-10 w-10 text-[var(--lp-accent)]" />
              <h3 className="text-lg font-bold text-foreground font-serif">
                Check your inbox
              </h3>
              <p className="text-sm text-muted-foreground">
                If an account exists for{" "}
                <span className="font-medium text-foreground">{email}</span>,
                we&apos;ve sent a password reset link. For security, it expires
                in 30 minutes and can be used once.
              </p>
              <p className="text-sm text-muted-foreground">
                Didn&apos;t get it? Check your spam folder, or{" "}
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="cursor-pointer font-semibold text-[var(--lp-accent)] hover:underline"
                >
                  try a different email
                </button>
                .
              </p>
              <Button
                type="button"
                onClick={onClose}
                className="w-full cursor-pointer rounded-xl bg-[var(--lp-accent)] py-6 font-semibold text-[var(--lp-accent-ink)] transition hover:brightness-[1.06]"
              >
                Done
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Enter your email and we&apos;ll send a password reset link. For
                security, links expire in 30 minutes.
              </p>

              {error && (
                <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                  {error}
                </p>
              )}

              <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="forgot-email"
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="rounded-xl pl-10"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full cursor-pointer rounded-xl bg-[var(--lp-accent)] py-6 font-semibold text-[var(--lp-accent-ink)] transition hover:brightness-[1.06]"
                >
                  {loading ? "Sending..." : "Send reset link"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
