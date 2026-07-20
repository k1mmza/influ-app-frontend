"use client";

import Link from "next/link";
import { useState } from "react";
import { apiForgotPassword } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // We show the same confirmation whether or not the email exists — the backend
  // never reveals account existence, and neither does this screen.
  const [submitted, setSubmitted] = useState(false);

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
    <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-3xl bg-card p-8 shadow-sm ring-1 ring-border">
        {submitted ? (
          <div className="space-y-4">
            <CheckCircle2 className="h-10 w-10 text-[var(--lp-accent)]" />
            <h1 className="text-2xl font-bold text-foreground font-serif">
              Check your inbox
            </h1>
            <p className="text-sm text-muted-foreground">
              If an account exists for <span className="font-medium text-foreground">{email}</span>,
              we&apos;ve sent a password reset link. For security, it expires in
              30 minutes and can be used once.
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
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-[var(--lp-accent)] hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lp-accent)]">
              Account recovery
            </p>
            <h1 className="mt-2 text-3xl font-bold text-foreground font-serif">
              Forgot password?
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your email and we&apos;ll send a password reset link. For
              security, links expire in 30 minutes.
            </p>

            {error && (
              <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                {error}
              </p>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
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

            <p className="mt-5 text-center text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link href="/login" className="font-semibold text-[var(--lp-accent)] hover:underline">
                Back to login
              </Link>
            </p>
          </>
        )}
      </section>
    </div>
  );
}
