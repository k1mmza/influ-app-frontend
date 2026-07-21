"use client";

import { Sparkles, Globe, Heart, Link2, Activity, MessageSquare, type LucideIcon } from "lucide-react";
import { LandingAnimate } from "@/components/marketing/landing-motion";

/**
 * Feature grid from the Stitch landing.
 *
 * ⚠️ COPY DEVIATES FROM THE MOCKUP ON PURPOSE. The Stitch text is placeholder
 * marketing and three of its six claims are not true of this app:
 *
 *   - "audience sentiment analysis"  — no sentiment feature exists anywhere in
 *     the codebase. Removed.
 *   - "Human Notes / share internal feedback that AI can't capture" — there is
 *     no collaborative notes feature. The only `notes` column in the schema is
 *     the influencer's own description. Replaced with messaging, which is real.
 *   - "Deep API access for real-time metrics" — the sync adapters are partly
 *     stubs. Narrowed to the platforms actually wired up.
 *
 * Everything below is checked against the backend. Do not restore the mockup
 * copy without checking the feature exists first.
 */

type Feature = { icon: LucideIcon; title: string; body: string; tag?: string };

const FEATURES: Feature[] = [
  {
    icon: Sparkles,
    title: "Smart Plan (AI)",
    body: "Describe the campaign in a sentence and get a drafted brief back — objective, deliverables, and a starting creator profile.",
    tag: "AI-assisted",
  },
  {
    icon: Globe,
    title: "Discover everywhere",
    body: "Search the directory by niche, reach, and audience — or paste an Instagram, TikTok, or YouTube link to pull a profile straight in.",
  },
  {
    icon: Heart,
    title: "Shortlist workflow",
    body: "Save creators as you browse and gather them into a shortlist before you send a single brief.",
  },
  {
    icon: Link2,
    title: "Shareable tracking",
    body: "Share a live campaign report by link. Anyone can open it — no account, no exported spreadsheet.",
    tag: "Public link",
  },
  {
    icon: Activity,
    title: "Platform sync",
    body: "Connect a YouTube or TikTok account to keep follower and engagement numbers refreshed automatically.",
  },
  {
    icon: MessageSquare,
    title: "Talk it through",
    body: "Message creators about a campaign in the app, so the brief and the conversation stay in the same place.",
  },
];

export function LandingFeatures() {
  return (
    <section className="w-full bg-tv-surface-container-high px-4 py-tv-section-gap">
      <div className="mx-auto w-full max-w-7xl md:px-tv-margin-safe">
        <LandingAnimate>
          <p className="font-tv-body text-tv-label-caps uppercase text-tv-muted-text">
            What&rsquo;s in the kit
          </p>
          <h2 className="mt-2 max-w-2xl font-tv-serif text-3xl font-bold tracking-tight text-tv-on-surface sm:text-tv-headline-lg">
            Everything the trip needs, nothing it doesn&rsquo;t.
          </h2>
        </LandingAnimate>

        <div className="mt-14 grid gap-tv-gutter sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <LandingAnimate key={f.title} delay={i * 60} direction="none">
              <div className="group flex h-full flex-col border border-tv-outline-variant bg-tv-surface-container-lowest p-7 transition-colors hover:border-tv-primary">
                <div className="flex items-start justify-between gap-4">
                  <span className="inline-flex h-11 w-11 items-center justify-center border border-tv-outline-variant text-tv-primary transition-colors group-hover:border-tv-primary">
                    <f.icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  {f.tag ? (
                    <span className="border border-dashed border-tv-outline-variant px-2 py-1 font-tv-body text-tv-label-caps uppercase text-tv-muted-text">
                      {f.tag}
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-6 font-tv-serif text-tv-headline-md text-tv-on-surface">
                  {f.title}
                </h3>
                <p className="mt-2 flex-1 font-tv-body text-tv-body-md text-tv-on-surface-variant">
                  {f.body}
                </p>
              </div>
            </LandingAnimate>
          ))}
        </div>
      </div>
    </section>
  );
}
