"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiResetPassword } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";

// Keep in sync with the backend RegisterDto / ResetPasswordDto rule.
const MIN_PASSWORD_LENGTH = 6;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await apiResetPassword(token, password);
      setDone(true);
      // Give the user a moment to read the confirmation, then send to login.
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "This password reset link is invalid or has expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  // No token in the link → nothing to reset.
  if (!token) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground font-serif">
          Invalid reset link
        </h1>
        <p className="text-sm text-muted-foreground">
          This link is missing its reset token. Please request a new password
          reset link.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--lp-accent)] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-4">
        <CheckCircle2 className="h-10 w-10 text-[var(--lp-accent)]" />
        <h1 className="text-2xl font-bold text-foreground font-serif">
          Password updated
        </h1>
        <p className="text-sm text-muted-foreground">
          Your password has been changed and you&apos;ve been signed out of all
          sessions. Redirecting you to login&hellip;
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--lp-accent)] hover:underline"
        >
          Go to login now
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lp-accent)]">
        Account recovery
      </p>
      <h1 className="mt-2 text-3xl font-bold text-foreground font-serif">
        Set a new password
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Choose a new password for your account. This link can be used once.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="rounded-xl px-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm new password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirm"
              type={showPassword ? "text" : "password"}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="rounded-xl pl-10"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full cursor-pointer rounded-xl bg-[var(--lp-accent)] py-6 font-semibold text-[var(--lp-accent-ink)] transition hover:brightness-[1.06]"
        >
          {loading ? "Updating..." : "Reset password"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link href="/login" className="font-semibold text-[var(--lp-accent)] hover:underline">
          Back to login
        </Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-3xl bg-card p-8 shadow-sm ring-1 ring-border">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </section>
    </div>
  );
}
