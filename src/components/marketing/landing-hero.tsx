"use client";

import { LandingAnimate } from "@/components/marketing/landing-motion";
import { Search, ArrowRight, Compass } from "lucide-react";
import Image from "next/image";
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
    <section className="relative w-full overflow-hidden bg-tv-surface px-4 pb-tv-section-gap pt-12">
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center gap-12 px-4 md:flex-row md:px-tv-margin-safe">
        {/* ── Left column: the pitch + the working casting bar ─────────────── */}
        <div className="z-10 flex-1 space-y-8">
          <LandingAnimate onMount>
            <p className="inline-flex items-center gap-2 font-tv-body text-tv-label-caps uppercase text-tv-muted-text">
              <span className="inline-block h-1.5 w-1.5 rounded-tv-full bg-tv-primary" />
              Inflique — creator casting
            </p>
          </LandingAnimate>

          <LandingAnimate onMount delay={120}>
            <h1 className="font-tv-serif text-4xl font-bold leading-tight text-tv-on-surface sm:text-5xl md:text-tv-display-lg">
              Cast the right creator.{" "}
              <span className="font-normal italic text-tv-primary">Not the loudest one.</span>
            </h1>
          </LandingAnimate>

          <LandingAnimate onMount delay={230}>
            <p className="max-w-xl font-tv-body text-tv-body-lg text-tv-on-surface-variant">
              Search creators by niche, reach, and audience — or paste a profile
              link and get their real numbers back in seconds.
            </p>
          </LandingAnimate>

          {/* The Casting Bar — now a pill per the travelogue composition, but the
              same real form: submits to /discover, detects pasted profile URLs,
              and cross-fades the rotating brief hint. */}
          <LandingAnimate onMount delay={340}>
            <form onSubmit={handleSubmit} className="max-w-2xl text-left">
              <div className="group relative flex flex-col gap-2 rounded-tv-xl border border-tv-outline-variant bg-tv-surface-container-lowest p-2 transition focus-within:border-tv-primary sm:flex-row sm:items-center sm:rounded-tv-full">
                <div className="relative flex flex-1 items-center">
                  <Search className="pointer-events-none absolute left-4 h-5 w-5 text-tv-muted-text" />
                  {/* Cycling casting hint, rendered as an overlay so it can cross-fade
                      (a native placeholder attribute cannot animate). */}
                  {showCastingHint && (
                    <span
                      aria-hidden
                      key={briefIndex}
                      className="motion-safe:animate-[lpFade_2800ms_ease-in-out] pointer-events-none absolute left-12 right-4 truncate font-tv-body text-tv-body-md text-tv-on-surface-variant"
                    >
                      <span className="text-tv-primary">Now casting:</span>{" "}
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
                    className="h-12 w-full bg-transparent pl-12 pr-4 font-tv-body text-tv-body-md text-tv-on-surface outline-none placeholder:text-tv-muted-text"
                    placeholder={showCastingHint ? "" : "Search a niche, name, or profile link"}
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-tv-full bg-tv-primary px-8 font-tv-body text-tv-label-caps uppercase text-tv-on-primary transition-all hover:bg-tv-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tv-primary focus-visible:ring-offset-2 active:scale-95"
                >
                  Find creators
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </LandingAnimate>

        </div>

        {/* ── Right column: the tilted "postcard" ──────────────────────────────
            Photo is /public/pictures/travel.png — a real photograph, natively
            3648x4560 (exactly 4:5), so it fills this frame with no crop and no
            object-position tuning. Replaces the Stitch mockup's AI-generated
            hero, which had "InfluApp" (the old product name) printed on props
            in-shot and had to be crop-dodged.

            The bottom of the frame is a bright amber floor reflection, so the
            wordmark below sits on a scrim rather than trusting the image. */}
        {/* LandingAnimate renders the flex child itself, so the sizing has to go
            HERE. Putting flex-1 on a div inside it collapsed this column to zero
            width and the fill-image rendered nothing at all. */}
        <LandingAnimate onMount delay={200} className="w-full flex-1">
          <div className="relative w-full">
            <div className="relative aspect-[4/5] w-full -rotate-2 overflow-hidden border border-tv-outline-variant bg-tv-surface-container">
              <Image
                src="/pictures/travel.png"
                alt="A traveller silhouetted against an airport window at sunset, suitcase in hand, watching a plane take off."
                fill
                priority
                sizes="(max-width: 768px) 100vw, 45vw"
                className="object-cover object-center"
              />
              {/* Scrim. The overlay text sits on a photograph, so its contrast
                  is not something the palette can guarantee — this pins the
                  bottom of the frame dark enough for white type to clear AA
                  regardless of what the image does there. */}
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 via-black/30 to-transparent"
              />
              <div className="absolute right-6 top-6">
                <div className="flex h-16 w-16 rotate-12 items-center justify-center rounded-tv-full border-2 border-dashed border-tv-primary bg-tv-surface/80 backdrop-blur-[2px]">
                  <Compass className="h-7 w-7 text-tv-primary" strokeWidth={1.5} />
                </div>
              </div>
              <div className="absolute bottom-6 left-6">
                <p className="font-tv-serif text-2xl font-bold tracking-tight text-white">
                  INFLIQUE
                </p>
                <p className="font-tv-body text-tv-label-caps uppercase text-white/80">
                  Creator casting directory
                </p>
              </div>
            </div>
          </div>
        </LandingAnimate>
      </div>
    </section>
  );
}
