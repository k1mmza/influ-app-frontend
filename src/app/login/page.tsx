"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@/lib/types";
import { useUserStore } from "@/store/useUserStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useUserStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="grid w-full max-w-5xl overflow-hidden border-none shadow-2xl md:grid-cols-2">
        <aside className="relative hidden flex-col justify-between bg-slate-950 p-10 text-white md:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20" />
          
          <Link href="/" className="relative z-10 inline-flex items-center gap-2 text-lg font-bold transition hover:opacity-80">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-secondary text-sm text-white">
              IA
            </span>
            <span className="font-serif">InfluApp</span>
          </Link>

          <div className="relative z-10 max-w-sm">
            <h2 className="text-4xl font-bold leading-tight tracking-tight font-serif">Master the pulse of the creator economy.</h2>
            <p className="mt-6 text-lg text-muted-foreground">
              "Precision analytics is no longer a luxury; it&apos;s the engine that drives influence into measurable impact."
            </p>
            <div className="mt-10 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary/80 to-secondary/80 p-0.5">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-900 text-xs font-bold">SC</div>
              </div>
              <div>
                <p className="text-sm font-semibold">Sarah Chen</p>
                <p className="text-xs text-muted-foreground">Head of Growth, Global Brands Inc.</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex gap-10">
            <div>
              <p className="text-2xl font-bold font-serif">98%</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">ROI Accuracy</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-serif">2.4M</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Creators Indexed</p>
            </div>
          </div>
        </aside>

        <CardContent className="flex flex-col justify-center bg-background p-8 md:p-12">
          <div className="mx-auto w-full max-w-sm space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight font-serif">Welcome back</h1>
              <p className="text-sm text-muted-foreground">Sign in to your account to manage campaigns</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="rounded-xl">
                <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" aria-hidden="true">
                  <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.9-4.1 2.9-6.9 0-.7-.1-1.5-.2-2.2H12z" />
                  <path fill="#34A853" d="M12 22c2.6 0 4.8-.9 6.4-2.5l-3.1-2.4c-.9.6-2 .9-3.3.9-2.5 0-4.6-1.7-5.4-4H3.4v2.5A10 10 0 0 0 12 22z" />
                  <path fill="#4A90E2" d="M6.6 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.5H3.4A10 10 0 0 0 2.4 12c0 1.6.4 3.1 1 4.5L6.6 14z" />
                  <path fill="#FBBC05" d="M12 6c1.4 0 2.6.5 3.5 1.4l2.6-2.6A10 10 0 0 0 3.4 7.5L6.6 10c.8-2.3 2.9-4 5.4-4z" />
                </svg>
                Google
              </Button>
              <Button variant="outline" className="rounded-xl">
                <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" aria-hidden="true">
                  <path fill="currentColor" d="M17.6 12.7c0-2.4 2-3.6 2.1-3.7-1.2-1.7-3-1.9-3.6-1.9-1.5-.1-3 .9-3.8.9s-2-.9-3.3-.9c-1.7 0-3.2 1-4.1 2.4-1.8 3.1-.5 7.7 1.3 10.3.9 1.3 1.9 2.8 3.3 2.8 1.4-.1 1.9-.8 3.6-.8s2.1.8 3.6.8c1.5 0 2.4-1.3 3.3-2.6 1-1.5 1.4-2.9 1.4-3-.1-.1-2.7-1-2.8-4.3zM15.1 5.6c.7-.9 1.2-2.1 1.1-3.3-1 .1-2.2.7-2.9 1.6-.7.8-1.3 2-1.2 3.2 1.1.1 2.3-.6 3-1.5z" />
                </svg>
                Apple
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground font-medium">Or continue with email</span>
              </div>
            </div>

            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            
            <form className="space-y-4" onSubmit={handleSignIn}>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className="rounded-xl" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" title="Reset your password" className="text-xs font-semibold text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="rounded-xl" />
              </div>

              <Button type="submit" disabled={loading} className="w-full rounded-xl py-6 text-base font-bold shadow-lg shadow-primary/20 transition-all hover:translate-y-[-1px]">
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-bold text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
