"use client";

import { LandingAnimate } from "@/components/marketing/landing-motion";
import { Search, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

// Concrete casting briefs the bar cycles through — specific to searching over
// creators, not generic SaaS copy. This is the page's signature: "The Casting Bar".
const CASTING_BRIEFS = [
  "skincare · under 100k · Bangkok",
  "vegan chefs on TikTok",
  "gaming creators · English + Thai",
  "sustainable fashion · Gen Z",
  "fitness coaches · 50k–200k reach",
] as const;

const CATEGORIES = ["Beauty", "Fashion", "Fitness", "Food", "Travel", "Tech", "Gaming"] as const;

function looksLikeSocialUrl(query: string) {
  return (
    /^(https?:\/\/|www\.)/i.test(query) ||
    /(?:instagram|tiktok|youtube|youtu\.be|facebook|x\.com|twitter|lemon8)\./i.test(query)
  );
}

export function LandingHero() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [briefIndex, setBriefIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cycle the casting brief shown in the (empty, unfocused) bar. This is the one
  // deliberate ongoing motion moment; it freezes the instant the visitor engages,
  // and respects prefers-reduced-motion by never starting.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setBriefIndex((i) => (i + 1) % CASTING_BRIEFS.length);
    }, 2800);
    return () => window.clearInterval(timer);
  }, []);

  const showCastingHint = !focused && searchQuery.length === 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      router.push("/discover");
      return;
    }
    if (looksLikeSocialUrl(query)) {
      const url = /^https?:\/\//i.test(query) ? query : `https://${query}`;
      router.push(`/discover?url=${encodeURIComponent(url)}`);
    } else {
      router.push(`/discover?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <section className="relative w-full overflow-hidden bg-[var(--lp-paper)] px-4 pb-24 pt-16 sm:pt-24">
      {/* Quiet index grid — barely-there texture that reads as "catalog", not decoration. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage:
            "linear-gradient(var(--lp-line) 1px, transparent 1px), linear-gradient(90deg, var(--lp-line) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(ellipse 90% 70% at 50% 30%, #000 30%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 70% at 50% 30%, #000 30%, transparent 72%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-4xl text-center">
        <LandingAnimate onMount>
          <p className="mb-6 inline-flex items-center gap-2 font-[family-name:var(--font-grotesk)] text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--lp-muted)]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--lp-accent)]" />
            Inflique — creator casting
          </p>
        </LandingAnimate>

        <LandingAnimate onMount delay={120}>
          <h1 className="font-[family-name:var(--font-display)] text-[13vw] font-semibold leading-[0.95] tracking-tight text-[var(--lp-ink)] sm:text-6xl md:text-7xl">
            Cast the right creator.
            <br />
            <span className="text-[var(--lp-muted)]">Not the loudest one.</span>
          </h1>
        </LandingAnimate>

        <LandingAnimate onMount delay={230}>
          <p className="mx-auto mt-6 max-w-lg font-[family-name:var(--font-grotesk)] text-base leading-relaxed text-[var(--lp-ink-soft)] sm:text-lg">
            Search creators by niche, reach, and audience — or paste a profile
            link and get their real numbers back in seconds.
          </p>
        </LandingAnimate>

        {/* The Casting Bar — the signature element. */}
        <LandingAnimate onMount delay={340}>
          <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-2xl text-left">
            <div className="group relative flex flex-col gap-2 rounded-2xl border border-[var(--lp-line)] bg-[var(--lp-surface)] p-2 shadow-[0_1px_0_rgba(0,0,0,0.02),0_18px_40px_-24px_rgba(0,0,0,0.25)] transition focus-within:border-[var(--lp-accent-line)] focus-within:shadow-[0_0_0_4px_var(--lp-accent-soft),0_18px_40px_-24px_rgba(0,0,0,0.25)] sm:flex-row sm:items-center">
              <div className="relative flex flex-1 items-center">
                <Search className="pointer-events-none absolute left-4 h-5 w-5 text-[var(--lp-muted)]" />
                {/* Cycling casting hint, rendered as an overlay so it can cross-fade
                    (a native placeholder attribute cannot animate). */}
                {showCastingHint && (
                  <span
                    aria-hidden
                    key={briefIndex}
                    className="motion-safe:animate-[lpFade_2800ms_ease-in-out] pointer-events-none absolute left-12 right-4 truncate font-[family-name:var(--font-grotesk)] text-[15px] text-[var(--lp-muted)]"
                  >
                    <span className="text-[var(--lp-accent)]">Now casting:</span>{" "}
                    {CASTING_BRIEFS[briefIndex]}
                  </span>
                )}
                <input
                  ref={inputRef}
                  type="text"
                  aria-label="Search creators, niches, or paste a profile link"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  className="h-12 w-full rounded-xl bg-transparent pl-12 pr-4 font-[family-name:var(--font-grotesk)] text-[15px] text-[var(--lp-ink)] outline-none placeholder:text-[var(--lp-muted)]"
                  placeholder={showCastingHint ? "" : "Search a niche, name, or profile link"}
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--lp-accent)] px-6 font-[family-name:var(--font-grotesk)] text-sm font-semibold text-[var(--lp-accent-ink)] transition hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--lp-surface)] active:scale-[0.99]"
              >
                Find creators
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </LandingAnimate>

        <LandingAnimate onMount delay={440}>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/discover?category=${cat}`}
                className="rounded-full border border-[var(--lp-line)] bg-[var(--lp-surface)] px-3.5 py-1.5 font-[family-name:var(--font-grotesk)] text-[13px] font-medium text-[var(--lp-ink-soft)] transition hover:border-[var(--lp-accent-line)] hover:text-[var(--lp-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-accent)]"
              >
                {cat}
              </Link>
            ))}
          </div>
        </LandingAnimate>
      </div>
    </section>
  );
}
