"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { LandingAnimate } from "@/components/marketing/landing-motion";

// The one place the app's persona identity colours appear on the marketing page —
// as a restrained tick + label only, never as a fill or the page palette.
const LANES = [
  {
    tag: "For brands",
    color: "var(--lp-brand)",
    title: "Brief creators, not agencies.",
    body: "Search by audience and reach, shortlist in a click, and send a brief without a middleman markup.",
    href: "/agencies",
    cta: "Start a campaign",
  },
  {
    tag: "For agencies",
    color: "var(--lp-agency)",
    title: "Run every client roster in one place.",
    body: "Manage discovery, outreach, and reporting across all your brands from a single workspace.",
    href: "/agencies",
    cta: "Book a walkthrough",
  },
  {
    tag: "For creators",
    color: "var(--lp-creator)",
    title: "Get found by brands that fit.",
    body: "Claim your profile, show real numbers, and let the right campaigns come to you directly.",
    href: "/creators",
    cta: "Claim your profile",
  },
] as const;

export function LandingPersonas() {
  return (
    <section className="w-full border-y border-tv-outline-variant bg-tv-surface-container-low px-4 py-tv-section-gap">
      <div className="mx-auto w-full max-w-7xl md:px-tv-margin-safe">
        <LandingAnimate>
          <h2 className="max-w-2xl font-tv-serif text-3xl font-bold leading-tight tracking-tight text-tv-on-surface sm:text-tv-headline-lg">
            One directory, three seats at the table.
          </h2>
        </LandingAnimate>

        <div className="mt-14 grid gap-px overflow-hidden border border-tv-outline-variant bg-tv-outline-variant md:grid-cols-3">
          {LANES.map((lane, i) => (
            <LandingAnimate key={lane.tag} delay={i * 90} direction="none">
              <Link
                href={lane.href}
                className="group flex h-full flex-col bg-tv-surface-container-lowest p-8 transition hover:bg-tv-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tv-primary md:p-10"
              >
                <span className="inline-flex items-center gap-2 font-tv-body text-tv-label-caps uppercase text-tv-muted-text">
                  <span className="h-3 w-[3px] rounded-full" style={{ backgroundColor: lane.color }} />
                  {lane.tag}
                </span>

                <h3 className="mt-6 font-tv-serif text-tv-headline-md leading-snug text-tv-on-surface">
                  {lane.title}
                </h3>

                <p className="mt-3 flex-1 font-tv-body text-tv-body-md text-tv-on-surface-variant">
                  {lane.body}
                </p>

                <span className="mt-8 inline-flex items-center gap-1.5 font-tv-body text-tv-label-caps uppercase text-tv-primary">
                  {lane.cta}
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Link>
            </LandingAnimate>
          ))}
        </div>
      </div>
    </section>
  );
}
