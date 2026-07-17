"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { apiSelectRole } from "@/lib/api";
import { Role } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const ROLES = [
  {
    id: "agency" as Role,
    label: "Agency",
    heading: "Power your entire talent operation.",
    desc: "Manage multiple top-tier talents.",
    detail: "Oversee campaigns, talent rosters, and brand partnerships — all from a single dashboard built for agency teams.",
    icon: "🏢",
  },
  {
    id: "brand" as Role,
    label: "Brand",
    heading: "Find the creator your brand deserves.",
    desc: "Discover perfect creator matches.",
    detail: "Find and vet creators by niche, audience, and performance. Launch campaigns and track ROI in real time.",
    icon: "🛍️",
  },
  {
    id: "influencer" as Role,
    label: "Influencer",
    heading: "Turn your audience into your business.",
    desc: "Share stories and build community.",
    detail: "Showcase your media kit, connect with brands, and manage collabs — everything a creator needs to grow.",
    icon: "✨",
  },
];

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [isOAuthMode, setIsOAuthMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role>("brand");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { register, setRole: storeSetRole } = useUserStore();

  // If the user already has a token (came from OAuth callback), skip to role step
  useEffect(() => {
    const token = useUserStore.getState().token;
    if (token) {
      setIsOAuthMode(true);
      setStep(1);
    }
  }, []);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(1);
  };

  const handleCompleteRegistration = async () => {
    setError("");
    setLoading(true);
    try {
      if (isOAuthMode) {
        const token = useUserStore.getState().token!;
        await apiSelectRole(token, selectedRole);
        storeSetRole(selectedRole);
        router.push("/dashboard");
      } else {
        await register(name, email, password, selectedRole);
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Failed to register. Please try again.");
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
              Build your creator growth engine.
            </h2>
            <p className="text-base leading-relaxed text-slate-200 drop-shadow">
              Launch faster, match smarter, and scale your partnerships with trusted creator insights.
            </p>
          </div>
        </aside>

        <CardContent className="flex flex-col justify-center bg-card p-8 md:p-12">
          <div className="mx-auto w-full max-w-sm space-y-8">
            {step === 0 ? (
              <>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight font-serif">Create your account</h1>
                  <p className="text-sm text-muted-foreground">Join Inflique and start connecting with creators.</p>
                </div>

                <Button
                  variant="outline"
                  className="w-full rounded-xl cursor-pointer"
                  onClick={() => { window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/auth/google`; }}
                >
                  <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" aria-hidden="true">
                    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.9-4.1 2.9-6.9 0-.7-.1-1.5-.2-2.2H12z" />
                    <path fill="#34A853" d="M12 22c2.6 0 4.8-.9 6.4-2.5l-3.1-2.4c-.9.6-2 .9-3.3.9-2.5 0-4.6-1.7-5.4-4H3.4v2.5A10 10 0 0 0 12 22z" />
                    <path fill="#4A90E2" d="M6.6 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.5H3.4A10 10 0 0 0 2.4 12c0 1.6.4 3.1 1 4.5L6.6 14z" />
                    <path fill="#FBBC05" d="M12 6c1.4 0 2.6.5 3.5 1.4l2.6-2.6A10 10 0 0 0 3.4 7.5L6.6 10c.8-2.3 2.9-4 5.4-4z" />
                  </svg>
                  Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><Separator /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground font-medium">Or continue with email</span>
                  </div>
                </div>

                <form className="space-y-4" onSubmit={handleNextStep}>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="rounded-xl" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" required className="h-4 w-4 rounded border-input bg-background" id="terms" />
                    <Label htmlFor="terms" className="text-xs text-muted-foreground font-normal">
                      I agree to the <Link href="/terms" target="_blank" rel="noopener noreferrer" className="underline">Terms</Link> and <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">Privacy Policy</Link>.
                    </Label>
                  </div>
                  <Button type="submit" className="w-full rounded-xl py-6 text-base font-bold shadow-lg transition-all hover:translate-y-[-1px] bg-[var(--lp-accent)] text-[var(--lp-accent-ink)] hover:bg-[var(--lp-accent)] hover:brightness-[1.06]">
                    Create Account
                  </Button>
                </form>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight font-serif">Select your role</h1>
                  <p className="text-sm text-muted-foreground">Choose how you will use Inflique.</p>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4">
                    {ROLES.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => setSelectedRole(r.id)}
                        className={cn(
                          "relative cursor-pointer rounded-2xl border-2 p-4 transition-all hover:border-[var(--lp-accent-line)]",
                          selectedRole === r.id ? "border-[var(--lp-accent)] bg-[var(--lp-accent-soft)]" : "border-border bg-card"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background text-2xl shadow-sm select-none">
                            {r.icon}
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{r.label}</p>
                            <p className="text-xs text-muted-foreground">{r.desc}</p>
                          </div>
                          {selectedRole === r.id && (
                            <div className="ml-auto h-5 w-5 rounded-full bg-[var(--lp-accent)] flex items-center justify-center shrink-0">
                              <svg className="h-3 w-3 text-[var(--lp-accent-ink)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 space-y-3">
                    {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                    <Button disabled={loading} onClick={handleCompleteRegistration} className="w-full rounded-xl py-6 text-base font-bold shadow-lg bg-[var(--lp-accent)] text-[var(--lp-accent-ink)] hover:bg-[var(--lp-accent)] hover:brightness-[1.06]">
                      {loading ? "Setting up…" : isOAuthMode ? "Continue to Dashboard" : "Complete Registration"}
                    </Button>
                    {!isOAuthMode && (
                      <Button variant="ghost" disabled={loading} onClick={() => setStep(0)} className="w-full rounded-xl">
                        Go Back
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-[var(--lp-accent)] hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
