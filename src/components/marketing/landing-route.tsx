"use client";

import { Search, Mail, Navigation2, ClipboardCheck, type LucideIcon } from "lucide-react";
import { LandingAnimate } from "@/components/marketing/landing-motion";

/**
 * "The Route to Success" — the itinerary section from the Stitch landing.
 *
 * Four stops connected by a dotted route line, each with a passport-stamp badge.
 * Copy is taken from the mockup and checked against what the app actually does:
 * discover/search, campaign invite + application, campaign execution, and the
 * public tracking report are all real backend features.
 */

type Stop = { icon: LucideIcon; title: string; body: string; stamp: string };

const STOPS: Stop[] = [
  {
    icon: Search,
    title: "Discover",
    body: "Search creators by niche, reach, and audience — or paste a profile link to pull their real numbers.",
    stamp: "Stamped",
  },
  {
    icon: Mail,
    title: "Invite / Apply",
    body: "Send a brief straight to a creator, or open the campaign and let creators apply to you.",
    stamp: "Waypoint",
  },
  {
    icon: Navigation2,
    title: "Run campaign",
    body: "Keep briefs, submitted content, and the conversation with each creator in one place.",
    stamp: "Pinned",
  },
  {
    icon: ClipboardCheck,
    title: "Track results",
    body: "Measure what shipped, then share a live report link with anyone — no account needed to read it.",
    stamp: "Certified",
  },
];

export function LandingRoute() {
  return (
    <section className="w-full bg-tv-background px-4 py-tv-section-gap">
      <div className="mx-auto w-full max-w-7xl md:px-tv-margin-safe">
        <LandingAnimate>
          <p className="font-tv-body text-tv-label-caps uppercase text-tv-muted-text">
            The itinerary
          </p>
          <h2 className="mt-2 font-tv-serif text-3xl font-bold tracking-tight text-tv-on-surface sm:text-tv-headline-lg">
            The Route to Success
          </h2>
        </LandingAnimate>

        <ol className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-tv-gutter">
          {/* Dotted route line connecting the stops — the design brief's
              "dotted route" device. Desktop only; on mobile the stops stack and
              the line would run through the copy. */}
          <span
            aria-hidden
            className="absolute left-0 right-0 top-7 hidden border-t border-dashed border-tv-outline-variant md:block"
          />
          {STOPS.map((stop, i) => (
            <li key={stop.title} className="relative">
              <LandingAnimate delay={i * 90} direction="none">
                <span className="relative z-10 inline-flex h-14 w-14 items-center justify-center rounded-tv-full border border-tv-outline-variant bg-tv-surface-container-lowest text-tv-primary">
                  <stop.icon className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <p className="mt-6 font-tv-body text-tv-label-caps uppercase text-tv-muted-text">
                  {String(i + 1).padStart(2, "0")} · {stop.stamp}
                </p>
                <h3 className="mt-2 font-tv-serif text-tv-headline-md text-tv-on-surface">
                  {stop.title}
                </h3>
                <p className="mt-2 font-tv-body text-tv-body-md text-tv-on-surface-variant">
                  {stop.body}
                </p>
              </LandingAnimate>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
