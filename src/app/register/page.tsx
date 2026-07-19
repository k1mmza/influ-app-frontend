"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, Heart, MessageSquare, ShoppingBag, Sparkles, Users, type LucideIcon } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { apiSelectRole } from "@/lib/api";
import { apiGetInfluencers } from "@/lib/influencers";
import { Role, Influencer } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const ROLES = [
  {
    id: "agency" as Role,
    label: "Agency",
    desc: "Manage multiple top-tier talents.",
    icon: Building2,
    tone: "var(--lp-agency)",
  },
  {
    id: "brand" as Role,
    label: "Brand",
    desc: "Discover perfect creator matches.",
    icon: ShoppingBag,
    tone: "var(--lp-brand)",
  },
  {
    id: "influencer" as Role,
    label: "Influencer",
    desc: "Share stories and build community.",
    icon: Sparkles,
    tone: "var(--lp-creator)",
  },
];

/* ── Signature moment ─────────────────────────────────────────────────
   A constellation of REAL platform creators — avatars pulled from the same
   public roster endpoint the landing page uses — connected by graphite
   hairlines. The floating engagement badges + emoji (BADGES/EMOJI below) are
   deliberately decorative placeholder UI matching the stakeholder mock; they
   are NOT sourced metrics. The avatars themselves remain real. */

type NodeSize = "center" | "md" | "sm";

// Nodes are clustered center-right so the bottom-left stays clear for the
// value-prop text overlay (avoids avatars stacking on the copy).
const NODES: { x: number; y: number; size: NodeSize; accent?: boolean }[] = [
  { x: 54, y: 44, size: "center" },
  { x: 33, y: 18, size: "sm" },
  { x: 73, y: 15, size: "md", accent: true },
  { x: 90, y: 44, size: "sm" },
  { x: 82, y: 76, size: "md" },
  { x: 57, y: 83, size: "sm" },
  { x: 31, y: 33, size: "md" },
];

// Extra satellite-to-satellite links for a denser web (indices into NODES).
const LINKS: [number, number][] = [
  [1, 6],
  [2, 3],
  [4, 5],
];

const SIZE_CLASS: Record<NodeSize, string> = {
  center: "h-32 w-32 lg:h-44 lg:w-44",
  md: "h-20 w-20 lg:h-28 lg:w-28",
  sm: "h-14 w-14 lg:h-20 lg:w-20",
};

// Floating engagement badges + emoji reactions — decorative placeholder mock UI
// (per stakeholder reference), not sourced metrics.
const BADGES: { icon: LucideIcon; value: string; x: number; y: number }[] = [
  { icon: Heart, value: "1000", x: 62, y: 26 },
  { icon: Users, value: "10", x: 42, y: 38 },
  { icon: MessageSquare, value: "100", x: 66, y: 54 },
];

const EMOJI: { char: string; x: number; y: number }[] = [
  { char: "😍", x: 24, y: 22 },
  { char: "🙂", x: 90, y: 28 },
  { char: "😃", x: 48, y: 82 },
];

function getAvatarUrl(influencer: Influencer): string | null {
  return (
    influencer.avatarUrl ??
    Object.values(influencer.avatarByPlatform ?? {}).find(Boolean) ??
    null
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** One creator node. Falls back to initials (never a broken-image icon), and
 *  to a quiet pulsing placeholder while the roster is still loading. */
function ConstellationNode({
  influencer,
  size,
  loading,
}: {
  influencer: Influencer | null;
  size: NodeSize;
  loading: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const url = influencer ? getAvatarUrl(influencer) : null;
  const ring =
    "rounded-full border border-[var(--lp-line)] bg-[var(--lp-surface-2)] shadow-sm ring-4 ring-[var(--lp-paper)]";

  if (loading || !influencer) {
    return (
      <div
        className={cn(
          SIZE_CLASS[size],
          ring,
          loading && "motion-safe:animate-pulse"
        )}
        aria-hidden="true"
      />
    );
  }

  if (!url || failed) {
    return (
      <div
        className={cn(
          SIZE_CLASS[size],
          ring,
          "flex items-center justify-center font-[family-name:var(--font-grotesk)] text-sm font-semibold text-[var(--lp-ink)]"
        )}
        title={influencer.name}
      >
        {getInitials(influencer.name)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- avatars are arbitrary remote hosts; plain img avoids next/image domain config
    <img
      src={url}
      alt={influencer.name}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn(SIZE_CLASS[size], ring, "object-cover")}
    />
  );
}

function CreatorConstellation() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiGetInfluencers({ limit: NODES.length })
      .then((res) => {
        if (!cancelled) {
          setInfluencers(res.data);
          setTotal(res.total);
        }
      })
      .catch(() => {
        if (!cancelled) setInfluencers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Trigger the entrance transition after first paint. Under reduced motion the
  // motion-safe: starting styles never apply, so nodes render static instantly.
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Reuse roster entries if the platform has fewer creators than nodes, so the
  // web never shows a visible gap.
  const nodeInfluencer = (i: number): Influencer | null =>
    influencers.length ? influencers[i % influencers.length] : null;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[var(--lp-paper)]">
      {/* soft persimmon glow behind the central node */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: "var(--lp-accent-soft)" }}
        aria-hidden="true"
      />

      {/* connecting hairlines */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className={cn(
          "absolute inset-0 h-full w-full transition-opacity duration-700",
          !mounted && "motion-safe:opacity-0"
        )}
        aria-hidden="true"
      >
        {NODES.slice(1).map((n, i) => (
          <line
            key={`spoke-${i}`}
            x1={NODES[0].x}
            y1={NODES[0].y}
            x2={n.x}
            y2={n.y}
            stroke={n.accent ? "var(--lp-accent-line)" : "var(--lp-line)"}
            strokeWidth={n.accent ? 1.5 : 1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {LINKS.map(([a, b], i) => (
          <line
            key={`link-${i}`}
            x1={NODES[a].x}
            y1={NODES[a].y}
            x2={NODES[b].x}
            y2={NODES[b].y}
            stroke="var(--lp-line)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {/* creator avatars */}
      {NODES.map((n, i) => (
        <div
          key={`node-${i}`}
          className={cn(
            "absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out",
            !mounted && "motion-safe:scale-90 motion-safe:opacity-0"
          )}
          style={{
            left: `${n.x}%`,
            top: `${n.y}%`,
            transitionDelay: `${i * 70}ms`,
          }}
        >
          <ConstellationNode
            influencer={nodeInfluencer(i)}
            size={n.size}
            loading={loading}
          />
        </div>
      ))}

      {/* floating engagement badges (decorative mock) */}
      {BADGES.map((b, i) => {
        const Icon = b.icon;
        return (
          <div
            key={`badge-${i}`}
            className={cn(
              "absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full bg-[var(--lp-accent)] px-3 py-1.5 font-[family-name:var(--font-grotesk)] text-sm font-bold text-[var(--lp-accent-ink)] shadow-lg transition-all duration-500",
              !mounted && "motion-safe:scale-90 motion-safe:opacity-0"
            )}
            style={{ left: `${b.x}%`, top: `${b.y}%`, transitionDelay: `${320 + i * 90}ms` }}
            aria-hidden="true"
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
            {b.value}
          </div>
        );
      })}

      {/* emoji reactions (decorative mock) */}
      {EMOJI.map((e, i) => (
        <div
          key={`emoji-${i}`}
          className={cn(
            "absolute z-20 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-[var(--lp-surface)] text-xl shadow-md ring-1 ring-[var(--lp-line)] transition-all duration-500",
            !mounted && "motion-safe:scale-90 motion-safe:opacity-0"
          )}
          style={{ left: `${e.x}%`, top: `${e.y}%`, transitionDelay: `${420 + i * 90}ms` }}
          aria-hidden="true"
        >
          {e.char}
        </div>
      ))}

      {/* value proposition — bottom-left */}
      <div className="absolute bottom-8 left-8 z-30 max-w-sm lg:bottom-12 lg:left-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold leading-[1.1] tracking-tight text-[var(--lp-ink)] lg:text-3xl">
          Launch faster, match smarter, and scale your{" "}
          <span className="text-[var(--lp-accent)]">partnerships</span>
        </h2>
        <p className="mt-3 font-[family-name:var(--font-grotesk)] text-base text-[var(--lp-ink-soft)]">
          with trusted creator insights.
        </p>
        <div className="mt-5 h-1 w-16 rounded-full bg-[var(--lp-accent)]" />
        <p className="mt-5 max-w-xs text-sm leading-relaxed text-[var(--lp-muted)]">
          Find the right creators, track performance, and build powerful collaborations all in one place.
        </p>
        {total !== null && total > 0 && (
          <p className="mt-6 font-[family-name:var(--font-grotesk)] text-xs font-medium uppercase tracking-[0.2em] text-[var(--lp-muted)]">
            {total.toLocaleString()} creators already on Inflique
          </p>
        )}
      </div>
    </div>
  );
}

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
    <div className="relative min-h-[44rem] w-full overflow-hidden bg-[var(--lp-paper)]">
      <div className="grid min-h-[44rem] md:grid-cols-[7fr_3fr]">
        {/* ─── Real-creator constellation (signature panel) ───────── */}
        <aside className="relative hidden md:block">
          <CreatorConstellation />
        </aside>

        <div className="flex items-center justify-center p-6 lg:p-10">
          <div className="w-full max-w-md rounded-3xl bg-[var(--lp-surface)] p-8 shadow-2xl lg:p-10">
            <div className="mx-auto w-full max-w-sm space-y-8">
            {step === 0 ? (
              <>
                <div className="space-y-2">
                  <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--lp-ink)]">
                    Create your account
                  </h1>
                  <p className="text-sm text-[var(--lp-muted)]">
                    Join Inflique and start connecting with creators.
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="w-full cursor-pointer rounded-xl border-[var(--lp-line)]"
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
                  Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><Separator className="bg-[var(--lp-line)]" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[var(--lp-surface)] px-2 font-medium text-[var(--lp-muted)]">Or continue with email</span>
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
                    <Label htmlFor="terms" className="text-xs font-normal text-[var(--lp-muted)]">
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
                  <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--lp-ink)]">
                    Select your role
                  </h1>
                  <p className="text-sm text-[var(--lp-muted)]">Choose how you will use Inflique.</p>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4">
                    {ROLES.map((r) => {
                      const Icon = r.icon;
                      const active = selectedRole === r.id;
                      return (
                        <div
                          key={r.id}
                          onClick={() => setSelectedRole(r.id)}
                          className={cn(
                            "relative cursor-pointer rounded-2xl border-2 p-4 transition-all hover:border-[var(--lp-accent-line)]",
                            active ? "border-[var(--lp-accent)] bg-[var(--lp-accent-soft)]" : "border-[var(--lp-line)] bg-[var(--lp-surface)]"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className="flex h-12 w-12 items-center justify-center rounded-xl"
                              style={{ backgroundColor: `color-mix(in srgb, ${r.tone} 12%, transparent)`, color: r.tone }}
                            >
                              <Icon className="h-5 w-5" strokeWidth={2} />
                            </div>
                            <div>
                              <p className="font-bold text-[var(--lp-ink)]">{r.label}</p>
                              <p className="text-xs text-[var(--lp-muted)]">{r.desc}</p>
                            </div>
                            {active && (
                              <div className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--lp-accent)]">
                                <svg className="h-3 w-3 text-[var(--lp-accent-ink)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-3 pt-4">
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

            <p className="text-center text-sm text-[var(--lp-muted)]">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-[var(--lp-accent)] hover:underline">
                Log in
              </Link>
            </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
