"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { ForgotPasswordModal } from "@/components/auth/forgot-password-modal";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useUserStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center px-4 py-12">
      <Card className="grid w-full max-w-5xl overflow-hidden border shadow-2xl md:grid-cols-2">
        {/* ─── Brand image panel ───────────────────────────────── */}
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-10 text-white md:flex">
          {/* Full-bleed related photo */}
          <Image
            src="/pictures/influencer.jpg"
            alt="Creator filming content outdoors"
            fill
            priority
            sizes="(min-width: 768px) 50vw, 0px"
            className="object-cover"
          />
          {/* Gradient scrim for legibility */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-slate-950/40" />

          <div className="relative z-10 mt-auto max-w-sm space-y-3">
            <h2 className="font-serif text-4xl font-bold leading-tight tracking-tight drop-shadow-lg">
              Master the pulse of the creator economy.
            </h2>
            <p className="text-base leading-relaxed text-slate-200 drop-shadow">
              Precision analytics that turn influence into measurable impact.
            </p>
          </div>
        </aside>

        {/* ─── Form panel ──────────────────────────────────────── */}
        <CardContent className="flex flex-col justify-center bg-card p-8 md:p-12">
          <div className="mx-auto w-full max-w-sm space-y-8">
            {/* Mobile logo (brand panel is hidden on mobile) */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-lg font-bold transition hover:opacity-80 md:hidden"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-sm text-white">
                IA
              </span>
              <span className="font-serif">Inflique</span>
            </Link>

            <div className="space-y-2">
              <h1 className="font-serif text-3xl font-bold tracking-tight">
                Welcome back
              </h1>
              <p className="text-sm text-muted-foreground">
                Sign in to your account to manage campaigns.
              </p>
            </div>

            <Button
              variant="outline"
              className="w-full cursor-pointer rounded-xl py-6"
              onClick={() => {
                window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/auth/google`;
              }}
            >
              <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" aria-hidden="true">
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.9-4.1 2.9-6.9 0-.7-.1-1.5-.2-2.2H12z" />
                <path fill="#34A853" d="M12 22c2.6 0 4.8-.9 6.4-2.5l-3.1-2.4c-.9.6-2 .9-3.3.9-2.5 0-4.6-1.7-5.4-4H3.4v2.5A10 10 0 0 0 12 22z" />
                <path fill="#4A90E2" d="M6.6 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.5H3.4A10 10 0 0 0 2.4 12c0 1.6.4 3.1 1 4.5L6.6 14z" />
                <path fill="#FBBC05" d="M12 6c1.4 0 2.6.5 3.5 1.4l2.6-2.6A10 10 0 0 0 3.4 7.5L6.6 10c.8-2.3 2.9-4 5.4-4z" />
              </svg>
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 font-medium text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                {error}
              </p>
            )}

            <form className="space-y-4" onSubmit={handleSignIn}>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="rounded-xl pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    title="Reset your password"
                    className="cursor-pointer text-xs font-semibold text-[var(--lp-accent)] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
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
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className={cn(
                  "group w-full rounded-xl py-6 text-base font-bold shadow-lg transition-all",
                  "bg-[var(--lp-accent)] text-[var(--lp-accent-ink)] hover:bg-[var(--lp-accent)] hover:brightness-[1.06] hover:translate-y-[-1px]"
                )}
              >
                {loading ? "Signing In..." : "Sign In"}
                {!loading && (
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-bold text-[var(--lp-accent)] hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      {forgotOpen && (
        <ForgotPasswordModal
          initialEmail={email}
          onClose={() => setForgotOpen(false)}
        />
      )}
    </div>
  );
}
